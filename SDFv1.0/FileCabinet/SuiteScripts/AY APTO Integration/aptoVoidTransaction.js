/**
 * Library of functions dedicated to voiding transactions. Please use with care!
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       08 Jan 2016     georgem		   Void transaction logic
 * @module aptoVoidTransaction
 *
 * @requires aptoSalesTransactionDefs
 */

/**
 * Read NetSuite instance accounting preferences and get void mode
 *
 * @returns {boolean}
 */
 function directVoidEnabled()
 {
	var accountingPreferences = nlapiLoadConfiguration("accountingpreferences");

	var directVoidEnabled = accountingPreferences.getFieldValue("REVERSALVOIDING");

	return (directVoidEnabled == "F")

 }
 /**
  * Select void mode based on how this instance of NS is configured
  *
  * @param recordType {string} NetSuite record type we would like to void
  * @param id {string} internal id of transaction to void
  *
  * @throws error if operation was not successful
  *
  */
 function voidTransaction(recordType, id) {
	try
	{
		// let's start with checking type - only 4 types are supported
		if (recordType == RECORD_TYPE_INVOICE ||
				recordType == RECORD_TYPE_JOURNAL_ENTRY ||
				recordType == RECORD_TYPE_CUST_PAYMENT ||
				recordType == RECORD_TYPE_CREDIT_MEMO)
		{
			// special handling for customer payments
			if (recordType == RECORD_TYPE_CUST_PAYMENT)
			{
				if (String(id).indexOf(PAYMENT_PREFIX_COBROKER_CHECK) !== -1)
				{
					id = String(id).substring(String(PAYMENT_PREFIX_COBROKER_CHECK).length);
					recordType = CUST_RECORD_TYPE_TRUST_COBROKER_PAYMENT;
				}
				else if (String(id).indexOf(PAYMENT_PREFIX_WRITE_OFF) !== -1)
				{
					id = String(id).substring(String(PAYMENT_PREFIX_WRITE_OFF).length);
					recordType = CUST_RECORD_TYPE_BAD_DEPT_WRITE_OFF;
				}
			}
			// check if transaction can be voided
			checkCanVoid(recordType, id);

			// change trans id and apto invoice id if applicable
			changeTransactionId(recordType, id, "VOIDED");

			if (directVoidEnabled() && itemInOpenPeriod(recordType, id))
				directVoidTransaction(recordType, id);
			else
				voidTransactionViaReversal(recordType, id);
		}
		else
		{
			var restletResult = new RESTLetResult();

			restletResult.isSuccess = false;

			restletResult.errorCode = ERROR_CODE_CANNOT_VOID_SELECTED_TRANS_TYPE;

			throw restletResult;
		}


	}
	catch (e)
	{
		if (e instanceof nlobjError && e.hasOwnProperty("getCode") && e.getCode() == "THIS_TRANSACTION_HAS_ALREADY_BEEN_VOIDED") {
			nlapiLogExecution('DEBUG', "Error", "Cannot void transaction twice, already voided");
		}
		else
			throw e; // pass the torch

	}
}

 /**
  * Check if specified transaction can be voided.
  *
  * @param {string} recordType - NetSuite transaction record type
  * @param {string} id - NetSuite internal record id
  *
  * @throws RESTLetResult - will throw exception, if transaction cannot be voided
  */
function checkCanVoid(recordType, id)
{
	// generally, transaction can be voided if it's not applied (credit memo, payment or bill to credit)
	// or has no applications (invoice)

	var isCanBeVoided = false;

	/// initialize hashmap of fields we would need to read from transaction (by type)
	var fields = {};

	fields[RECORD_TYPE_JOURNAL_ENTRY] = ["reversalentry"]; // , "voided"
	fields[RECORD_TYPE_INVOICE] = ["amountpaid"];
	fields[RECORD_TYPE_CUST_PAYMENT] = ["total"];
	fields[RECORD_TYPE_CREDIT_MEMO] = ["amountpaid"];
	fields[CUST_RECORD_TYPE_TRUST_COBROKER_PAYMENT] = ["isinactive"];
	fields[CUST_RECORD_TYPE_BAD_DEPT_WRITE_OFF] = ["isinactive"];


	nlapiLogExecution('DEBUG', 'Checking', 'Can ' + recordType + " " + id + " be voideed");

	var columns = nlapiLookupField(recordType, id, fields[recordType]);

	nlapiLogExecution('DEBUG', 'Data from transaction', JSON.stringify(columns));

	// evaluate
	if (recordType == RECORD_TYPE_INVOICE)
	{
		isCanBeVoided = (columns.amountpaid == '.00');
	}
	else if (recordType == RECORD_TYPE_JOURNAL_ENTRY)
	{
		isCanBeVoided = (columns.reversalentry == "")
	}
	else if (recordType == RECORD_TYPE_CUST_PAYMENT)
	{
		// can't lookup value I need
		var payment = nlapiLoadRecord(recordType, id);
		var applied = payment.getFieldValue("applied");
		nlapiLogExecution('DEBUG', "Applied", applied);

		isCanBeVoided = (applied == "0.00");
	}
	else if (recordType == RECORD_TYPE_CREDIT_MEMO)
	{
		isCanBeVoided = (columns.amountpaid == '.00');
	}
	else if (recordType == CUST_RECORD_TYPE_TRUST_COBROKER_PAYMENT || recordType == CUST_RECORD_TYPE_BAD_DEPT_WRITE_OFF)
	{
		isCanBeVoided = (columns.isinactive == "F");
	}

	if (isCanBeVoided)
	{
		nlapiLogExecution('DEBUG', 'Transaction ', "Can be voided"); //  + recordType + " " + id
	}
	else
	{
		var e = new RESTLetResult();
		e.errorCode = "RESTLET_CANT_VOID_TRANS";
		e.isSuccess = false;
		throw e;
	}

}


/**
 * Change transaction id to identify record as voided
 *
 *  Result would look like <b>[original id].[idString].[void time stamp]</b>
 *
 * @param recordType {string} NetSuite transaction record type
 * @param id {string} NetSuite internal id
 * @param idString {string} string to add to transaction id
 *
 */
function changeTransactionId(recordType, id, idString)
{

	nlapiLogExecution('DEBUG', 'Changing transaction number');

	/** @type nlobjRecord */
	var record =  nlapiLoadRecord(recordType, id);
	var newId = "";

	var invoiceNumber = "";
	var paymentNumber = "";

	// externalID should be populated on all items created by Apto integration
	newId = record.getFieldValue("tranid");

	// If it's not populated ... let's see if we have invoice id or payment id from Apto
	if (newId == null || newId == "")
	{
		if (recordType == RECORD_TYPE_INVOICE || recordType == RECORD_TYPE_JOURNAL_ENTRY || recordType == RECORD_TYPE_CREDIT_MEMO)
		{
			invoiceNumber = record.getFieldValue("custbody_apto_invoice");
		}

		if (recordType == RECORD_TYPE_CUST_PAYMENT || recordType == RECORD_TYPE_JOURNAL_ENTRY)
		{
			paymentNumber = record.getFieldValue("custbody_apto_payment_number");
		}

		// new id should be derived from Apto invoice or payment number.
		if (invoiceNumber != "")
			newId = invoiceNumber;
		else if (paymentNumber != "")
			newId = paymentNumber;
	}

	if (newId != "")
	{
		newId += "." + idString + "." + new Date().YYYYMMDDHHMMSS();

		if (newId.length > 44)
			newId = newId.substr(newId.length - 44);

		record.setFieldValue("externalid", newId);
		record.setFieldValue("tranid", newId);
	}

	nlapiSubmitRecord(record);

}

/**
 * Void NS transaction.
 * @param recordType {string} NetSuite record type we would like to void
 * @param id{string} internal id of transaction to void
 *
 * NetSuite API call I used here can throw following exception:
 * @throws CANT_VOID_TRANS — if you attempt to void a transaction that is linked to other transactions (for example, customer payment)
 * @throws INVALID_RCRD_TYPE — if the transactionType argument passed is not valid
 * @throws RCRD_DSNT_EXIST — if the recordId argument passed is not valid
 * @throws THIS_TRANSACTION_HAS_ALREADY_BEEN_VOIDED — if you attempt to void a transaction that has already been voided
 * @throws VOIDING_REVERSAL_DISALLWD —  if you attempt to void a transaction with inventory impact
 */
function directVoidTransaction(recordType, id)
{

	nlapiLogExecution( 'DEBUG', "Voiding " + recordType + " id " + id);

    var voidingId = nlapiVoidTransaction(recordType, id);

    nlapiLogExecution( 'DEBUG', "Done");


}

/**
 * Void NS transaction by creating reversing item<br />
 * Used for voiding during rollbacks<br />
 * Zendesk ticket 3340 - Use the transaction date and posting period from the original transaction on the reversing transaction<br />
 *
 * @param recordType {string} NetSuite record type we would like to void
 * @param id{string} internal id of transaction to void
 */
function voidTransactionViaReversal(recordType, id)
{
	nlapiLogExecution( 'DEBUG', "Voiding " + recordType + " id " + id);
	var accountingPeriod = new NSAccountingPeriod();

	switch (recordType)
	{
		case RECORD_TYPE_INVOICE:
			// invoice should be voided using credit memo
			accountingPeriod.setData(getAdjPeriodForNSInvoice(id));

			//DELOITTE FIX START - 3340 - ROLLBACK ISSUE WITH DATE
			var tranDate = new Date(nlapiLookupField('invoice', id, 'trandate'));
			var processingDate = new Date();
			//createCreditMemo4Invoice(id, CM_VOID, accountingPeriod, tranDate, processingDate); //DELOITTE CHANGE - ADD tranDate and processingDate
			createCreditMemo4Invoice(id, CM_VOID); //DELOITTE CHANGE - REMOVE accountingPeriod. original record's dates and period to be used 
			//DELOITTE FIX END

			break;
		case RECORD_TYPE_CUST_PAYMENT:
			// customer payment should be voided using JE
			voidCustomerPaymentViaJE(id);
			break;
		case CUST_RECORD_TYPE_TRUST_COBROKER_PAYMENT:
			// placeholder record - mark as inactive
		case CUST_RECORD_TYPE_BAD_DEPT_WRITE_OFF:
			// placeholder record - mark as inactive
			markCustomPaymentInactive(recordType, id);
			break;
		case RECORD_TYPE_CREDIT_MEMO:
			// credit memo should be voided using JE
			voidCreditMemo(id);
			break;
		case RECORD_TYPE_JOURNAL_ENTRY:
			// reverse JE in adjustment period (earliest open)
			// TODO better code for reversal date
			//var reverseDate  = nlapiDateToString(new Date(),  DATE_MASK);
			reverseJE(id, new Date(nlapiLookupField('journalentry', id, 'trandate')), false); //DELOITTE FIX - 3340 - USE ORIGINAL TRANSACTION DATE AS REVERSAL DATE FOR VOIDING
			break;
	}

    nlapiLogExecution( 'DEBUG', "Done");
}
