/**
 * Library of functions related to processing brokerage sales transaction coming from Apto
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       07 Jan 2016     georgem		   Business logic - process one sales transaction (including roll back in case of errors)
 *
 * 1.05						  georgem          Added void
 *
 * 1.10	      26 Feb 2016     georgem	       Adding adjustments to business logic
 *
 * @module aptoSalesTransaction
 *
 * @requires aptoModifyTransaction
 * @requires aptoSalesTransactionDefs
 * @requires aptoSalesTransactionLib
 * @requires aptoGetAdjPostingPeriodScript
 * @requires aptoVoidTransaction
 * @requires aptoInvoice
 * @requires aptoCreditMemo
 * @requires aptoJE
 */

/**
 * Process one APTO sales transaction
 *
 * @param {APTOTransaction} dataIn
 *
 * @returns {RESTLetResult} result
 *
 */
function processOneSalesTransaction(dataIn)
{
	nlapiLogExecution("DEBUG", "Starting sales transaction processing");

	var result = transactionWrapper(function(dataIn){ return processSalesTransaction(dataIn)},
			                    function(dataIn){ return validateData(dataIn) },
			                    dataIn);

	// nlapiLogExecution("DEBUG", "Sales transaction processing - done", JSON.stringify(result));

	return result;
}
/**
 * Validate received data structure
 *
 * @param {APTOTransaction} aptoSalesTransaction
 *
 * @throws Error if mandatory fields are missing
 */
function validateData(aptoSalesTransaction)
{
	var result = new RESTLetResult();

	var mandatoryFields = ["lines",
      // "postingPeriodInMillis",
      "terms",
      "transactionDateInMillis",
      "invoiceDateInMillis",
      "primaryBrokerId",
      "client",
      "accountingClassification",
      "billTo",
      "currency",
      "dealId",
      "invoiceType",
      "transactionId",
      "invoiceNo"];


	if (aptoSalesTransaction == null)
	{
		result.errorCode = ERROR_CODE_JSON_EMPTY;
		throw result;
	}

	var aptoTransaction = new APTOTransaction();

	if (aptoSalesTransaction.length != aptoTransaction.length)
	{
		result.errorCode = ERROR_CODE_INVALID_STRUCTURE;
		throw result;
	}

	// transaction must have invoice component ...
	if (aptoSalesTransaction.invoice == null)
	{
		result.errorCode = ERROR_CODE_MISSING_INVOICE;
		throw result;
	}

	for (var i = 0; i < mandatoryFields.length; i++) {
		if (! (aptoSalesTransaction.invoice.hasOwnProperty(mandatoryFields[i])
				&& aptoSalesTransaction.invoice[mandatoryFields[i]] != null
				&&aptoSalesTransaction.invoice[mandatoryFields[i]] != ""))
		{
			result.errorCode = ERROR_CODE_MISSING_FIELD + mandatoryFields[i]
			throw result;

		}
	}
}
/**
 * Posting Apto sales transaction to NetSuite
 *
 * @param {APTOTransaction} aptoSalesTransaction
 *
 * @returns {RESTLetResult}
 *
 * @throws Error if operation was not successful. Aborted transaction should not have any financial impact, full rollback
 * of operation is expected
 *
 * @todo  Once data migration is over, need to switch to @see accountingPeriodSearch method of selecting posting period.
 */
function processSalesTransaction(aptoSalesTransaction)
{
	var result = new RESTLetResult();
	var creditMemoId = "";
	var jeId = "";

	nlapiLogExecution("DEBUG", "Processing APTO sales transaction");

	// let's see what we need to do

	// if we have to create credit memo - let's start with that
	if (aptoSalesTransaction.offsetInvoice != null && aptoSalesTransaction.offsetInvoice.length > 0)
	{
		nlapiLogExecution("DEBUG", "Creating credit memo for invoice id " + aptoSalesTransaction.offsetInvoice);

		// var accountingPeriodId;

		// create credit memo and save id
//		if (nlapiGetContext().getEnvironment() == 'SANDBOX' && false) // closing loophole
//		{
//			nlapiLogExecution("DEBUG", "Executed in SandBox - looking for earliest open period");
//
		// AYPC-1008 .... Resurecting old code - need to handle  Apto creating items in closed period
		//TODO Once data migration is over, need to switch to accountingPeriodSearch again
		var subid = nlapiLookupField('invoice',aptoSalesTransaction.offsetInvoice,'subsidiary');
		var accountingPeriod = adjustmentAccountingPeriodSearch(dateInMillis2date(aptoSalesTransaction.invoice.transactionDateInMillis),subid);
		
		
		
//		}
//		else

		//var accountingPeriod = accountingPeriodSearch(dateInMillis2date(aptoSalesTransaction.invoice.transactionDateInMillis),subid); //  postingPeriodInMillis
		//creditMemoId = createCreditMemo4Invoice(aptoSalesTransaction.offsetInvoice, CM_MILESTONE, accountingPeriod, dateInMillis2date(aptoSalesTransaction.invoice.transactionDateInMillis));
		//DELOITTEJIRA 309:New date logic on trans date
		creditMemoId = createCreditMemo4Invoice(aptoSalesTransaction.offsetInvoice, CM_MILESTONE, 
					   accountingPeriod, dateInMillis2date(aptoSalesTransaction.invoice.transactionDateInMillis), 
					   aptoSalesTransaction.invoice.processingDateInMillis?dateInMillis2date(aptoSalesTransaction.invoice.processingDateInMillis):null);

	}

	try
	{

		result = createAPTOInvoice(aptoSalesTransaction.invoice);

		nlapiLogExecution("DEBUG", "Invoice " + aptoSalesTransaction.invoice.invoiceNo + " created");

		if (isValidTaxInformation(aptoSalesTransaction))
		{
			if (aptoSalesTransaction.invoice.invoiceType == INVOICE_TYPE_BILLED_EARNED)
			{
				nlapiLogExecution("DEBUG", "Creating JEs for 3rd party tax liability (invoice type " + aptoSalesTransaction.invoice.invoiceType + ")");

				jeId = salesTaxLiabilityJE(aptoSalesTransaction);

			}
			else

				//DELOITTE FIX : ACES-589 JE not reversing on invoice unprint
				nlapiLogExecution('DEBUG', 'Offset Invoice Number: ', aptoSalesTransaction.offsetInvoice);
				if(aptoSalesTransaction.offsetInvoice){ //if blank/null, then it is a new deal, no need to reverse JEs
					var offsetInvoiceId = aptoSalesTransaction.offsetInvoice;
					
					var aptoInvoiceNo = nlapiLookupField('invoice', offsetInvoiceId, 'custbody_apto_invoice');
					nlapiLogExecution('DEBUG', 'NS Invoice Number: ', aptoInvoiceNo);
					var transactionRecords = findAPTOinvoiceTransactions(aptoInvoiceNo);
					nlapiLogExecution('DEBUG', 'JEs related to the invoice: ', transactionRecords.length);
					reverseJEifExists(transactionRecords, dateInMillis2date(aptoSalesTransaction.invoice.transactionDateInMillis), dateInMillis2date(aptoSalesTransaction.invoice.processingDateInMillis)); //DELOITTE FIX ACES-705
				}
				//DELOITTE FIX END

				nlapiLogExecution("DEBUG", "NOT creating JEs for 3rd party tax liability (invoice type " + aptoSalesTransaction.invoice.invoiceType + ")");
		}

		return result;
	}
	catch (e)
	{

		try
		{
			//if credit memo was created - need to roll it back
			if (creditMemoId.length > 0)
			{
				nlapiLogExecution("DEBUG", "Rolling back credit memo");
				// have to un-apply credit memo from the invoice first
				// otherwise would not be able to void it
				unApplyCreditMemo(creditMemoId);

				voidTransaction(RECORD_TYPE_CREDIT_MEMO, creditMemoId);
			}

			// if we have created invoice - need to roll it back
			if (result.invoiceId != null && Number(result.invoiceId) > 0)
			{
				nlapiLogExecution("DEBUG", "Voiding invoice");
				voidTransaction(RECORD_TYPE_INVOICE, result.invoiceId);
			}

		}
		catch (e1)
		{
			nlapiLogExecution("DEBUG", "Rollback error ", e1.getCode() + " " + e1.getDetails());

			result.errorCode = ERROR_CODE_ROLLBACK_ERROR + "_" + e1.getCode() + " " + e1.getDetails() + " while recovering from " + e.getCode() + " " + e.getDetails()

			throw result;
		}

		throw e;
	}

}

/**
 * Check to see that we have entire tax block information and can indeed create JEs from it
 *
 * @param @param {APTOTransaction} aptoSalesTransaction
 * @returns {boolean}
 */
function isValidTaxInformation(aptoSalesTransaction)
{
	var isValid = false;

	isValid = aptoSalesTransaction.hasOwnProperty("thirdPartyTaxes") &&
			  aptoSalesTransaction.thirdPartyTaxes != null &&
	          aptoSalesTransaction.thirdPartyTaxes.length > 0 &&
	          aptoSalesTransaction.thirdPartyTaxes[0].hasOwnProperty("taxes") &&
	          aptoSalesTransaction.thirdPartyTaxes[0].taxes != null &&
	          aptoSalesTransaction.thirdPartyTaxes[0].taxes.length > 0;

	return isValid;
}
/**
 * Void single sales transaction
 *
 * @param {APTOVoidInvoice} aptoVoidInvoice Invoice to void
 */
function voidOneSalesTransaction(aptoVoidInvoice)
{
	nlapiLogExecution("DEBUG", "Void one sales transaction - start");

	result = transactionWrapper(function(dataIn){ return voidSalesTransaction(dataIn)},
			                    function(dataIn){ return validateVoidData(dataIn) },
			                    dataIn);

	nlapiLogExecution("DEBUG", "Void one sales transaction - end");


	return result;
}

/**
 * Validate passed data.
 *
 * @param {APTOVoidInvoice} aptoVoidInvoice
 */
function validateVoidData(aptoVoidInvoice)
{
	var result = new RESTLetResult();

	if (aptoVoidInvoice == null)
	{
		result.errorCode = ERROR_CODE_JSON_EMPTY;
		throw result;
	}

	var aptoTransaction = new APTOVoidInvoice();

	if (aptoVoidInvoice.length != aptoTransaction.length)
	{
		result.errorCode = ERROR_CODE_INVALID_STRUCTURE;
		throw result;
	}

	// transaction must have invoice component ...
	if (aptoVoidInvoice.aptoInvoiceNo == null)
	{
		result.errorCode = ERROR_CODE_MISSING_INVOICE;
		throw result;
	}

	return result;
}
/**
 * Void single sales transaction using the following steps:<br />
 * 1) Get invoice APTO has reference to<br />
 * 2) Get it's APTO invoice ID<br />
 * 3) Search for linked records (other invoices and JEs)<br/>
 * 4) Void them all<br />
 *
 * @param {APTOVoidInvoice} aptoVoidInvoice Invoice to void
 */
function voidSalesTransaction(aptoVoidInvoice)
{
	var result = new RESTLetResult();

	result.batchTransactionId = aptoVoidInvoice.batchTransactionId;

	nlapiLogExecution("DEBUG", "Voiding APTO sales transaction");

	// in order to void sales transaction, I need to do the following:
	// get invoice APTO has reference to
	// get it's APTO invoice ID
	// search for linked records (other invoices and JEs)
	// and void them all.s

	nlapiLogExecution("DEBUG", "Loading invoice record");

	/**
	 * Load invoice
	 *
	 * @type nlobjRecord
	 * @record invoice
	 */
	// var record =  nlapiLoadRecord(RECORD_TYPE_INVOICE, aptoVoidInvoice.invoiceId);

	/** APTO invoice number (custom field) @type String */
	// var aptoInvoiceNumber = record.getFieldValue("custbody_apto_invoice");

	// now we need to find ALL transactions that are linked to this APTO invoice

	nlapiLogExecution("DEBUG", "Voiding sales transaction " + aptoVoidInvoice.aptoInvoiceNo);

	var tansactionRecords = findAPTOinvoiceTransactions(aptoVoidInvoice.aptoInvoiceNo);


	if (tansactionRecords != null && tansactionRecords.length > 0)
	{
		for (var int = 0; int < tansactionRecords.length; int++) {
			/**
			 * @type {NSSearchResults}
			 */
			var transactionRecord = tansactionRecords[int];

			nlapiLogExecution("DEBUG", "Voiding " + transactionRecord.kind + " #" + transactionRecord.id);

			// voidTransaction(transactionRecord.kind, transactionRecord.id);
			// Logic change - instead of voiding transaction invoces would be written off and
			// JE reversed

			if (transactionRecord.kind == RECORD_TYPE_INVOICE)
			{
				createCreditMemo4Invoice(transactionRecord.id, CM_VOID);
			}
			else if (transactionRecord.kind == RECORD_TYPE_JOURNAL_ENTRY)
			{
				reverseJE(transactionRecord.id, new Date());
			}
			else
				nlapiLogExecution("DEBUG", "Unknown transaciton type for voiding " + transactionRecord.kind);
		}
		result.isSuccess = true;
	}
	else
	{
		result.isSuccess = false;
		result.errorCode = ERROR_CODE_CANNOT_FIND_TRANSACTIONS_TO_VOID;

		throw result;
	}


	return result;
}


/**
 * Adjust one APTO sales transaction - call wrapper to execute actual operation
 *
 * @param {APTOTransaction} dataIn
 *
 * @returns {RESTLetResult} result
 *
 */
function adjustOneSalesTransaction(dataIn)
{
	nlapiLogExecution("DEBUG", "Transaction Adjustments - start");

	result = transactionWrapper(function(dataIn){ return adjustSalesTransaction(dataIn)}, null, dataIn);

	nlapiLogExecution("DEBUG", "Transaction Adjustments - done");

	return result;
}


/**
 * @summary APTO sales transaction adjustment.
 *
 * @description First we need to figure out what to do, and once we know - perform change.
 * Some changes will require "step" - for example if we need to change total invoice amount AND bill to,
 * it would be an example of 2 step adjustment
 *
 * @param {APTOTransaction} aptoSalesTransaction - APTO sales transaction. In this cal, only fields that changed are present
 *
 * @returns {RESTLetResult}
 */
function adjustSalesTransaction(aptoSalesTransaction)
{
	var result = new RESTLetResult();

	nlapiLogExecution("DEBUG", "Figuring out adjustment type");

	if (aptoSalesTransaction.isVoided)
	{
		nlapiLogExecution("DEBUG", "Transaction has to be voided");

		var aptoVoidInvoice = new APTOVoidInvoice();

		aptoVoidInvoice.aptoInvoiceNo = aptoSalesTransaction.invoice.invoiceNo;
		aptoVoidInvoice.batchTransactionId = aptoSalesTransaction.batchTransactionId;

		result = voidSalesTransaction(aptoVoidInvoice);

	}
	else
	{
		nlapiLogExecution("DEBUG", "Transaction has to be modified");
		result = modifySalesTransaction(aptoSalesTransaction);
	}

	result.batchTransactionId = aptoSalesTransaction.batchTransactionId;
	return result;
}
