/**
 * Library of functions for NetSuite cash receipt (customer payment) processing
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       22 Jan 2016     georgem
 *
 * 1.01		  18 Feb 2016     georgem          change operation mode per AYPC-87 (incremental amount would passed as parameter)
 *
 * 1.1		  14 Dec 2016     georgem          co-broker trust payment processings
 * @module aptoPayment
 *
 * @requires aptoSalesTransactionDefs
 * @requires aptoSalesTransactionLib
 * @requires aptoGetAdjPostingPeriodScript
 * @requires aptoCustomerRefund
 * @requires aptoVoidTransaction
 * @requires aptoJE
 */

/**
 * @summary Get outstanding balance for customer payment.
 *
 * @description Code would analize payment id passed and would load either customer payment record or custom record to
 * report balance back to Apto
 *
 * @param {string} id NetSuite internal id of the payment record
 * @returns {aptoSalesTransactionDefs~APTOPaymentBalance}
 */
 //DELOITTE BUILD COMMIT:Sprint 6 deployment-1 
function getPaymentBalance(id)
{
	var currencyMap = new CurrencyMap();

	var paymentBalance = new APTOPaymentBalance();

	try
	{
		nlapiLogExecution("DEBUG", "Getting payment details for payment " + id);

		if (String(id).substring(0, String(PAYMENT_PREFIX_COBROKER_CHECK).length) == PAYMENT_PREFIX_COBROKER_CHECK)
		{
			var recordId = String(id).substring(String(PAYMENT_PREFIX_COBROKER_CHECK).length);

			nlapiLogExecution("DEBUG", "Getting payment details co-broker trust payment " + recordId);

			var payment = nlapiLoadRecord(CUST_RECORD_TYPE_TRUST_COBROKER_PAYMENT, recordId);

			nlapiLogExecution("DEBUG", "Repackaging");

			paymentBalance.paymentId = id;

			if (payment.getFieldValue("isinactive") == "T") // if it's marked inactive - it has been applied already
				paymentBalance.balance = "0.00";
			else
				paymentBalance.balance = payment.getFieldValue("custrecord_cbcr_amount");

			paymentBalance.currency = currencyMap.getKey(payment.getFieldValue("custrecord_cbcr_currency"));

			paymentBalance.amount = payment.getFieldValue("custrecord_cbcr_amount");
		}
		else if (String(id).substring(0, String(PAYMENT_PREFIX_WRITE_OFF).length) == PAYMENT_PREFIX_WRITE_OFF)
		{
			var recordId = String(id).substring(String(PAYMENT_PREFIX_WRITE_OFF).length);

			nlapiLogExecution("DEBUG", "Getting payment details for bad debt write-off " + recordId);

			var payment = nlapiLoadRecord(CUST_RECORD_TYPE_BAD_DEPT_WRITE_OFF, recordId);

			nlapiLogExecution("DEBUG", "Repackaging");

			paymentBalance.paymentId = id;


			if (payment.getFieldValue("isinactive") == "T") // if it's marked inactive - it has been applied already
				paymentBalance.balance = "0.00";
			else
				paymentBalance.balance = payment.getFieldValue("custrecord_bdwo_amount");

			paymentBalance.currency = currencyMap.getKey(payment.getFieldValue("custrecord_bdwo_currency"));

			paymentBalance.amount = payment.getFieldValue("custrecord_bdwo_amount");
		}
		else
		{
			var payment = nlapiLoadRecord(RECORD_TYPE_CUST_PAYMENT, id);

			nlapiLogExecution("DEBUG", "Repackaging");

			paymentBalance.paymentId = id;

			paymentBalance.balance = payment.getFieldValue("unapplied");

			paymentBalance.currency = currencyMap.getKey(payment.getFieldValue("currency"));

			paymentBalance.amount = payment.getFieldValue("payment");

		}

	}
	catch (e)
	{
		var result = new RESTLetResult();

		result.paymentId = id;

		result.errorCode = e.getCode() + " " + e.getDetails();
		// throw e;

		return result;

	}

	nlapiLogExecution("DEBUG", "Payment Balance " + JSON.stringify(paymentBalance));
	nlapiLogExecution("DEBUG", "Done");

	return paymentBalance;

}

/**
 * Create NetSuite BILL TO payment for check recorded
 *
 * @param {APTOPayment} aptoPayment
 *
 * @return {RESTLetResult}
 */
function createPayment(aptoPayment)
{
	var result = new RESTLetResult();
	/**
	 * First thing we need to do is get brokerage deposit account (custom field on subsidiary record)
	 */
	var depositAccountId = getBrokerageDepositAccount(aptoPayment.accountingClassification.subsidiary)
	var initvalues = {};
	var paymentId = null;


	// if (aptoPayment.amount == "13.13")
	// {
	// 	nlapiLogExecution("DEBUG","Debug Amount Enterted - bailing out");
	// 	result.isSuccess = false;
	// 	result.errorCode = "DEBUG_AMOUNT_ENTERED";
	// 	throw result;
	// }



	if (aptoPayment.paymentMethod == PAYMENT_METHOD_CO_BROKER_TRUST_CHECK)
	{
		nlapiLogExecution("DEBUG","Co-Broker Trust Check Processing");

		var payment = nlapiCreateRecord(CUST_RECORD_TYPE_TRUST_COBROKER_PAYMENT, initvalues);


		initNSCustomPaymentRecord(payment, aptoPayment, depositAccountId);

		paymentId = nlapiSubmitRecord(payment);

		paymentId = PAYMENT_PREFIX_COBROKER_CHECK + paymentId;
	}
	else if (aptoPayment.paymentMethod == PAYMENT_METHOD_WRITE_OFF)
	{
		nlapiLogExecution("DEBUG","Bad Dept Write Off Processing");

		var payment = nlapiCreateRecord(CUST_RECORD_TYPE_BAD_DEPT_WRITE_OFF, initvalues);


		initNSCustomPaymentRecord(payment, aptoPayment, depositAccountId);
		paymentId = nlapiSubmitRecord(payment);

		paymentId = PAYMENT_PREFIX_WRITE_OFF + paymentId;
	}
	else
	{


		initvalues.recordmode = 'dynamic';
		initvalues.entity = aptoPayment.billTo;  // bill to

		var payment = nlapiCreateRecord(RECORD_TYPE_CUST_PAYMENT, initvalues);

		nlapiLogExecution("DEBUG", "Payment record created");

		initNSPaymentRecord(payment, aptoPayment, depositAccountId); // , jeID

		paymentId = nlapiSubmitRecord(payment);
	}

	nlapiLogExecution("DEBUG", "Payment Created", "Payment ID " + paymentId);

	result.isSuccess = true;
	result.paymentId = paymentId;
	result.balance = aptoPayment.amount;

	return result;


}

/**
 * Initialize payment record with information received from APTO
 *
 * @param {nlobjRecord} payment NetSuite payment record
 *
 * @param {APTOPayment} aptoPayment - APTO Payment information
 * @param {string} depositAccountId - NS internal ID of deposit account to use
 * @param {string} jeID - JE that suppose to be linked to this payment (NS ID)
 * @param {string} arAccount - internal ID of ar account used (optional)
 */
function initNSPaymentRecord(payment, aptoPayment, depositAccountId, jeID, arAccount)
{
	var currencyMap = new CurrencyMap();
	var paymentMethods = new PaymentMethods();

	payment.setFieldValue("subsidiary", aptoPayment.accountingClassification.subsidiary);
	// Mar 2nd, 2015 - per agreement we had, hard coding segmentation for payments
	// payment.setFieldValue("department", aptoPayment.accountingClassification.department);
	// payment.setFieldValue("location", aptoPayment.accountingClassification.market) // market/cost center
	// payment.setFieldValue("class", aptoPayment.accountingClassification.category);  // category

	payment.setFieldValue("department",PAYMENT_DEFAULT_DEPT);
	payment.setFieldValue("location", PAYMENT_DEFAUL_MCC) // market/cost center
	payment.setFieldValue("class", PAYMENT_DEFAULT_CATHEGORY);  // category


	payment.setFieldValue("aracct", ACCOUNT_REC_BILLED_EARNED); // A/R account

	payment.setFieldValue("checknum", aptoPayment.checkNumber);

	payment.setFieldValue("currency",currencyMap.getValue(aptoPayment.currency));

	payment.setFieldValue("externalid",aptoPayment.aptoPaymentNumber);
	payment.setFieldValue("tranid", aptoPayment.aptoPaymentNumber);

	if (aptoPayment.hasOwnProperty("memo") && aptoPayment.memo != null)
		payment.setFieldValue("memo", aptoPayment.memo);

	payment.setFieldValue("custbody_apto_payment_number", aptoPayment.aptoPaymentNumber);



	if (jeID == null)
		payment.setFieldValue("payment", aptoPayment.amount);
	else
	{
		if (arAccount != null && arAccount != "")
			payment.setFieldValue("aracct", arAccount);

		associatePaymentAndJE(payment,aptoPayment.amount , jeID); // this will "find" this payment
	}
	payment.setFieldValue("paymentmethod",paymentMethods.getValue(aptoPayment.paymentMethod));

	payment.setFieldValue("custbody_deposit_scanner_id", aptoPayment.depositScannerId);


	payment.setFieldValue("undepfunds","F");
	payment.setFieldValue("account",depositAccountId);

	var tranDate = nlapiDateToString(dateInMillis2date(aptoPayment.transactionDateInMillis), DATE_MASK);

	payment.setFieldValue("custbody_ay_apto_trans_date", tranDate);

	var postingPeriod = null;

	try {
		postingPeriod = accountingPeriodSearch(dateInMillis2date(aptoPayment.transactionDateInMillis), aptoPayment.accountingClassification.subsidiary); //ACES-480 use the date logic for payments

	}
	catch (error)
	{
		postingPeriod = adjustmentAccountingPeriodSearch(tranDate, aptoPayment.accountingClassification.subsidiary); //ACES-480 use the date logic for payments

		tranDate = postingPeriod.lastSunday;
	}



	payment.setFieldValue("trandate", tranDate);

	payment.setFieldValue("postingperiod",postingPeriod.id);

	//AYPC-268 set auto-apply to false
	payment.setFieldValue("autoapply","F");

}




/**
 * Initialize custom record - co-broker trust payment record with information received from APTO
 *
 * @param {nlobjRecord} custom NetSuite record
 * @param {APTOPayment} aptoPayment - APTO Payment information
 * @param {string} depositAccountId - NS internal ID of deposit account to use
 * @param {string} jeID - JE that suppose to be linked to this payment (NS ID)
 */
function initNSCustomPaymentRecord(payment, aptoPayment, depositAccountId, jeID)
{
	var currencyMap = new CurrencyMap();
	var paymentMethods = new PaymentMethods();

	var recordIdentifier = ""

	if (aptoPayment.paymentMethod == PAYMENT_METHOD_CO_BROKER_TRUST_CHECK)
		recordIdentifier = "cbcr";
	else if (aptoPayment.paymentMethod == PAYMENT_METHOD_WRITE_OFF)
		recordIdentifier = "bdwo";

	nlapiLogExecution("DEBUG", "Record Identifier",  recordIdentifier + " " + payment.getRecordType());

	payment.setFieldValue("custrecord_" + recordIdentifier + "_bill_to",aptoPayment.billTo);

	payment.setFieldValue("custrecord_" + recordIdentifier + "_subsidiary", aptoPayment.accountingClassification.subsidiary);

	payment.setFieldValue("custrecord_" + recordIdentifier + "_check_number", aptoPayment.checkNumber);


	payment.setFieldValue("custrecord_" + recordIdentifier + "_currency",currencyMap.getValue(aptoPayment.currency));

	payment.setFieldValue("name",aptoPayment.aptoPaymentNumber);
	payment.setFieldValue("externalid",aptoPayment.aptoPaymentNumber);

	if (aptoPayment.hasOwnProperty("memo") && aptoPayment.memo != null)
		payment.setFieldValue("custrecord_" + recordIdentifier + "_memo", aptoPayment.memo);

	var amountFieldName = "custrecord_" + recordIdentifier + "_amount";

	payment.setFieldValue(amountFieldName, aptoPayment.amount);
	// nlapiLogExecution("DEBUG", "Payment Amount",  aptoPayment.amount + " " + payment.getFieldValue(amountFieldName));

	payment.setFieldValue("custrecord_" + recordIdentifier + "_deposit_scanner_id", aptoPayment.depositScannerId);
	var tranDate = nlapiDateToString(dateInMillis2date(aptoPayment.transactionDateInMillis), DATE_MASK);
	payment.setFieldValue("custrecord_" + recordIdentifier + "_transaction_date", tranDate);

	payment.setFieldValue("custrecord_" + recordIdentifier + "_deposit_account",depositAccountId);

	if (aptoPayment.paymentMethod == PAYMENT_METHOD_CO_BROKER_TRUST_CHECK)
	{


		// search for possilbe link to check issued for in this subsidiary (match on check # and amount);
		if (aptoPayment.hasOwnProperty("checkNumber") &&
				aptoPayment.checkNumber != null &&
				aptoPayment.checkNumber != "") // AYPC-830 Added empty check number test
		{
			var checkId = getCheckId(aptoPayment.accountingClassification.subsidiary,
					aptoPayment.checkNumber,
					currencyMap.getValue(aptoPayment.currency),
					aptoPayment.amount);

			if (checkId != null)
				payment.setFieldValue("custrecord_" + recordIdentifier + "_check_record",checkId);
		}
	}

}

/**
 * Search list of credits and apply one that matches jeID to this payment
 *
 * @param payment
 * @param jeID
 *
 * @returns {Boolean} operation success
 */
function associatePaymentAndJE(payment, amount, jeID)
{
	// let's find out how many possible credits do we have
	var creditCount = payment.getLineItemCount(GROUP_TYPE_CREDIT);
	var lFound = false;

	// nlapiLogExecution("DEBUG", creditCount + " possible credits found");

	var lineTypes = [GROUP_TYPE_APPLY, GROUP_TYPE_CREDIT];

	for (var int = 0; int <= lineTypes.length; int++)
	{
		nlapiLogExecution("DEBUG","Searching", "Group Type " + lineTypes[int]);

		var lineNo = payment.findLineItemValue(lineTypes[int], "internalid", jeID);

		if (lineNo > 0)
		{
			nlapiLogExecution("DEBUG", lineTypes[int] + " line " + lineNo, "Applying " + amount == null?"all":amount);

			payment.selectLineItem(lineTypes[int], lineNo);

			if (amount != null)
				payment.setCurrentLineItemValue(lineTypes[int], "amount", amount);

			payment.setCurrentLineItemValue(lineTypes[int], "apply", "T");

			payment.commitLineItem(lineTypes[int]);

			lFound = true;

			break;
		}
	}


//	for (var int = 1; int <= creditCount; int++) {
//		// internal id of the invoice stored in this line
//		var internalid = payment.getLineItemValue(GROUP_TYPE_CREDIT,
//				"internalid", int);
//
//		// nlapiLogExecution("DEBUG", "internal id " + internalid);
//
//
//		if (internalid == jeID) // je found
//		{
//			nlapiLogExecution("DEBUG", "!!! -> internal id match " + internalid, " applying " + amount == null?"all":amount);
//			payment.selectLineItem(GROUP_TYPE_CREDIT, int);
//
//			if (amount != null)
//				payment.setCurrentLineItemValue(GROUP_TYPE_CREDIT, "amount", amount);
//
//			payment.setCurrentLineItemValue(GROUP_TYPE_CREDIT, "apply", "T");
//
//			payment.commitLineItem(GROUP_TYPE_CREDIT);
//
//			lFound = true;
//
//			break;
//		}
//		// else
//			// nlapiLogExecution("DEBUG", "internal id " + internalid);
//	}

	if (!lFound)
	{
		nlapiLogExecution("DEBUG", "!!! -> Credit did not match JE");
		var result = new RESTLetResult();
		result.errorCode = "RESTLET_ERROR_CREDIT_NOT_MATCHED";
	}

	return lFound;
}
/**
 * @summary Apply NetSuite payment to one or more invoices
 *
 * @description Payment aplication would apply previously created customer payment record to the invoice for native payments,
 * for custom payment types if would create JE and apply it instead.
 *
 * Payment application amount may be positive or negative. Negative amount for custom types would result in full un-application
 *
 * @param {APTOPaymentApplication} dataIn  - payment information
 */
function applyPayment(dataIn)
{
	// in order to apply payment, it has to be loaded first
	var payment = null;
	var customPaymentRecord = null;

	var result = new RESTLetResult();
	var aptoPaymentApplication = new APTOPaymentApplication();

	aptoPaymentApplication.setData(dataIn);

	var paymentId = 0;

	customPaymentRecord = loadCustomPaymentRecord(aptoPaymentApplication.paymentId);

	if (customPaymentRecord == null)
	{
		nlapiLogExecution("DEBUG", "Loading payment record");
		payment = nlapiLoadRecord(RECORD_TYPE_CUST_PAYMENT, aptoPaymentApplication.paymentId);
		nlapiLogExecution("DEBUG", "Payment record loaded");
	}
	else
	{
		// did we get a request to un-apply custom record type?
		if (aptoPaymentApplication.unApplyRequest())
			nlapiLogExecution("DEBUG", "Payment " + aptoPaymentApplication.paymentId, "Un-applying custom payment");
		else
			payment = createPaymentForCustomPayment(customPaymentRecord, Object.keys(aptoPaymentApplication.invoices)[0]);
	}

	result = (aptoPaymentApplication.unApplyRequest() && customPaymentRecord != null) ? unApplyCustomPayment(customPaymentRecord) :processPaymentApplication(aptoPaymentApplication, payment, customPaymentRecord);



	nlapiLogExecution("DEBUG", "done");

	return result;
}

/**
 * Load custom payment record if we have one
 *
 * @param {string} paymentId - NS internal payment ID prefixed with record type
 *
 * @returns {nlobjRecord} record
 */
function loadCustomPaymentRecord(paymentId)
{
	var record = null
	var recordId = null;
	var recordType = null;

	// do we have real payment record reference or id from cust table?
	if (String(paymentId).substring(0, String(PAYMENT_PREFIX_COBROKER_CHECK).length) == PAYMENT_PREFIX_COBROKER_CHECK)
	{
		recordId = String(paymentId).substring(String(PAYMENT_PREFIX_COBROKER_CHECK).length);
		recordType = CUST_RECORD_TYPE_TRUST_COBROKER_PAYMENT;

	}
	else if (String(paymentId).substring(0, String(PAYMENT_PREFIX_WRITE_OFF).length) == PAYMENT_PREFIX_WRITE_OFF)
	{
		recordId = String(paymentId).substring(String(PAYMENT_PREFIX_WRITE_OFF).length);
		recordType = CUST_RECORD_TYPE_BAD_DEPT_WRITE_OFF;

	}

	if (recordId != null)
	{
		// load record
		nlapiLogExecution("DEBUG", "Apply Payment","Getting payment details " + recordType + " " + recordId);
		record = nlapiLoadRecord(recordType, recordId);
		nlapiLogExecution("DEBUG", "Apply Payment","Custom record (" + recordType + ") loaded");
	}
	return record;

}

/**
 * Un apply custom payment record.
 *
 * Since custom records are implemented as JEs, this would require
 *
 * 1) Load JE
 * 2) Remove customer name from all lines (@see https://netsuite.custhelp.com/app/answers/detail/a_id/36112/kw/apply%20journal%20entry%20to%20invoice)
 * 3) Reverse it in current period
 *
 *
 * @param {nlobjrecord} customPaymentRecord
 *
 * @returns {RESTLetResult}
 * @throws {RESTLetResult}
 */
function unApplyCustomPayment(customPaymentRecord)
{
	var recordIdentifier = customPaymentRecord.getRecordType() == CUST_RECORD_TYPE_TRUST_COBROKER_PAYMENT?"cbcr":"bdwo";

	var jeId = customPaymentRecord.getFieldValue("custrecord_" + recordIdentifier + "_payment_record");

	var result = new RESTLetResult();

	if (jeId != null && jeId != "")
	{
		// DELOITTE FIX ACES 609: remove JE / Invoice association when the period is open
		//This is not working for psotingperiod so using Load Record nlapiLookupField('journalentry',jeId,['postingperiod','subsidiary']);
		var rec = nlapiLoadRecord('journalentry',jeId);
		var taskitemstatusSearch = nlapiSearchRecord("taskitemstatus",null,
				[
				   ["subsidiary","anyof",rec.getFieldValue('subsidiary')], 
				   "AND", 
				   ["period","abs",rec.getFieldValue('postingperiod')],
				   "AND", 
				   ["itemtype","anyof","PCP_LOCK_AR"]
				],
				[
				   new nlobjSearchColumn("period").setSort(false), 
				   new nlobjSearchColumn("subsidiary"), 
				   new nlobjSearchColumn("itemtype"), 
				   new nlobjSearchColumn("complete")
				]
				);
		nlapiLogExecution("DEBUG", "--Finding Open period for JE:--"+jeId);
		//Remove association if only the period is open 
		if(taskitemstatusSearch && taskitemstatusSearch.length == 1 && taskitemstatusSearch[0].getValue('complete')=='F')
			removeInvoiceAssociationFromJE(jeId);
		
		reverseJE(jeId, new Date());
		//DELOTTE FIX END
		nlapiLogExecution("DEBUG", "Removing JE link and marking record as active");
		// now let's break some links ....
		customPaymentRecord.setFieldValue("custrecord_" + recordIdentifier + "_payment_record","");
		customPaymentRecord.setFieldValue("isinactive", "F");

		result.isSuccess = true;
		result.balance =  customPaymentRecord.getFieldValue("custrecord_" + recordIdentifier + "_amount");

		nlapiSubmitRecord(customPaymentRecord);
	}
	else
	{
		nlapiLogExecution("DEBUG", "Custom Record " + recordIdentifier + " is not linked to JE");

		result.isSuccess = false;
		result.errorCode = ERROR_CODE_JE_ID_MISSING;

		throw result;
	}

	return result;
}
/**
 * Process actual application of payment to invoice
 * and deal with issues as they come up
 *
 * @param {APTOPaymentApplication} aptoPaymentApplication
 * @param {nlobjRecord} payment
 * @param {nlobjRecord} customPaymentRecord
 *
 * @returns {RESTLetResult}
 * @throws {RESTLetResut}
 */
function processPaymentApplication(aptoPaymentApplication, payment, customPaymentRecord)
{
	var paymentId = null;
	var result = new RESTLetResult();

	try
	{
		// let's find out how many outstanding invoices do we have
		var invoiceCount = payment.getLineItemCount(GROUP_TYPE_APPLY);

		nlapiLogExecution("DEBUG", invoiceCount + " possible applications found");

		if (invoiceCount === 0)
		{
			result.errorCode = ERROR_CODE_PAYMENT_HAS_NO_APPLICATIONS;
			throw result;
		}

		// apply payment to invoices
		var applicationCount = nsApplyPayment(payment, aptoPaymentApplication);

		if (applicationCount === 0)
		{
			result.errorCode = ERROR_CODE_CANNOT_FIND_INVOICES_TO_PAY;
			throw result;
		}
		else
		{
			paymentId = nlapiSubmitRecord(payment);

			nlapiLogExecution("DEBUG", "Payment Created/Submitted","=> Payment ID : " + paymentId);

			result.isSuccess = true;

			if (customPaymentRecord != null)
			{
				customPaymentRecord.setFieldValue("isinactive", "T");
				nlapiSubmitRecord(customPaymentRecord);
				nlapiLogExecution("DEBUG", "Payment Created",customPaymentRecord.getRecordType() + " marked inactive");
				result.balance = 0;
				// }
			}
			else
			{
				// load record back to see what got applied
				payment = nlapiLoadRecord(RECORD_TYPE_CUST_PAYMENT, paymentId);
				result.balance = payment.getFieldValue("unapplied");
				result.invoiceBalances = getInvoiceBalances(payment, aptoPaymentApplication);
			}

		}
	}
	catch (e)
	{
		if (customPaymentRecord != null)
		{

			// void JE if it was already created
			var recordIdentifier = customPaymentRecord.getRecordType() == CUST_RECORD_TYPE_TRUST_COBROKER_PAYMENT?"cbcr":"bdwo";

			var jeId = customPaymentRecord.getFieldValue("custrecord_" + recordIdentifier + "_payment_record");

			nlapiLogExecution("DEBUG", "Error applying custom payment record","Voiding JE " + jeId);
			voidTransaction(RECORD_TYPE_JOURNAL_ENTRY, jeId);

		}

		throw e;

	}

	return result;
}
/**
 * Apply payment as requested by APTO
 *
 * @param {nlobjRecord} payment NetSuite trainsaction record (customer payment)
 * @param {APTOPaymentApplication} aptoPaymentApplication Payment application information
 *
 * @returns {Number} - number of applications performed
 */
function nsApplyPayment(payment, aptoPaymentApplication)
{
	var applicationCount = 0;
	var invoiceIDs = Object.keys(aptoPaymentApplication.invoices);

	nlapiLogExecution("DEBUG", "Apply payment", invoiceIDs.length + " invoices are paid");
	// nlapiLogExecution("DEBUG", "Apply payment", JSON.stringify(paymentInvoices));

	for (var int = 0; int <= invoiceIDs.length; int++ ) {


		var invoiceId = invoiceIDs[int];
		var invoiceAmount = aptoPaymentApplication.invoices[invoiceId];

		if (invoiceAmount != 0) // workaround - Apto is sending extra "0" applicaitons that conflict with real ones
		{
			var lineNo = payment.findLineItemValue(GROUP_TYPE_APPLY, "internalid", invoiceId);

			if (lineNo > 0)
			{
				applicationCount++;



				nlapiLogExecution("DEBUG", "applying " + invoiceAmount + " to line "
						+ lineNo);

				payment.selectLineItem(GROUP_TYPE_APPLY, lineNo);

				var currentApplicationAmount = payment.getCurrentLineItemValue(
						GROUP_TYPE_APPLY, "amount");

				currentApplicationAmount = Number(currentApplicationAmount);

				currentApplicationAmount += invoiceAmount;

				if (currentApplicationAmount > 0) {
					nlapiLogExecution("DEBUG", "Current application :"
							+ currentApplicationAmount);
					payment.setCurrentLineItemValue(GROUP_TYPE_APPLY, "amount",
							currentApplicationAmount);
					payment.setCurrentLineItemValue(GROUP_TYPE_APPLY, "apply", "T");
				} else {
					nlapiLogExecution("DEBUG", "Payment un-applied");
					payment.setCurrentLineItemValue(GROUP_TYPE_APPLY, "amount",
							"0.00");
					payment.setCurrentLineItemValue(GROUP_TYPE_APPLY, "apply", "F");
				}
				payment.commitLineItem(GROUP_TYPE_APPLY);

			}
		}


	}

	return applicationCount;
}

/**
 * Get balances for invoices payment was applied to
 *
 * @param {nlobjRecord} payment
 * @param {APTOPaymentApplication} aptoPaymentApplication
 *
 * @returns {APTOInvoiceBalance[]}
 */
function getInvoiceBalances(payment, aptoPaymentApplication)
{
	var invoiceBalances = new Array();

	for (var int = 1; int <= payment.getLineItemCount(GROUP_TYPE_APPLY); int++) {
		// internal id of the invoice stored in this line
		var internalid = payment.getLineItemValue(GROUP_TYPE_APPLY,
				"internalid", int);

		// nlapiLogExecution("DEBUG", "internal id " + internalid);

		// find if this invoice was part of the application
		// var invoiceAmount = aptoPaymentApplication.getAmount(internalid);

		if (aptoPaymentApplication.isValidInvoice(internalid)) // if invoice was applied as a part of this operation
		{

			nlapiLogExecution("DEBUG", "Calculating balance for invoice " + internalid);

			payment.selectLineItem(GROUP_TYPE_APPLY, int);

			// var balance = Number(payment.getCurrentLineItemValue(GROUP_TYPE_APPLY, "total")) -  Number(payment.getCurrentLineItemValue(GROUP_TYPE_APPLY, "amount"));

			var total = payment.getCurrentLineItemValue(GROUP_TYPE_APPLY, "total");
			var amount = payment.getCurrentLineItemValue(GROUP_TYPE_APPLY, "amount");
			var balance = 0;

			if (amount == null || amount == "")
			{
				balance = total;
			}
			else
			{
				balance = math.number(math.subtract(math.bignumber(total), math.bignumber(amount) ));
			}

			nlapiLogExecution("DEBUG", "Balance " + balance);

			var invoiceBalance = new APTOInvoiceBalance();

			invoiceBalance.invoiceId = internalid;
			invoiceBalance.balance = balance;

			invoiceBalances.push(invoiceBalance);
		}
	}
	return invoiceBalances;
}
/**
 * Update NetSuite BILL TO payment
 *
 * Per discussion we had with Maria, old one should be voided and new one
 * created
 *
 * @param {APTOPayment} aptoPayment
 *
 */
function updatePayment(aptoPayment)
{
	nlapiLogExecution("DEBUG", "Starting payment update");
	var lCreate = false;
	var result = new RESTLetResult();

	if (aptoPayment.paymentId != null)
	{

		if (aptoPayment.hasOwnProperty("isVoided") && aptoPayment.isVoided)
		{
			nlapiLogExecution("DEBUG", "Payment is getting voided");
//			if (String(aptoPayment.paymentId).substring(0, String(PAYMENT_PREFIX_COBROKER_CHECK).length) == PAYMENT_PREFIX_COBROKER_CHECK)
//			{
//				result.isSuccess = false;
//				result.errorCode = ERROR_CODE_CANNON_VOID_CO_BROKER_CHECK_PAYMENT;
//			}
//			else
				result = voidPaymentRecord(aptoPayment);
		}
		else
		{
			//TO-DO remove once debugging is done.
//			if (aptoPayment.amount == "13.13")
//			{
//				nlapiLogExecution("DEBUG","Debug Amount Enterted - bailing out");
//				result.isSuccess = false;
//				result.errorCode = "DEBUG_AMOUNT_ENTERED";
//				throw result;
//			}

			if (aptoPayment.paymentMethod == PAYMENT_METHOD_CO_BROKER_TRUST_CHECK ||
					aptoPayment.paymentMethod == PAYMENT_METHOD_WRITE_OFF) // custom payment methods
			{

				lCreate = false;

				updateCoBrokerCheckPayment(aptoPayment);
				result.balance = aptoPayment.amount;
				result.isSuccess = true;
				result.paymentId = aptoPayment.paymentId;
			}
			else
			{
				// first - we need to find and void existing payment
				createCustomerRefund4payment(aptoPayment, true);
				lCreate = true;
			}
		}

	}
	else
	{
		nlapiLogExecution("DEBUG", "PaymentId not specified - doing create instead");
		lCreate = true;
	}
	if (lCreate) // and now we need to create payment again
		result = createPayment(aptoPayment);

	nlapiLogExecution("DEBUG", "done");

	return result;
}

/**
 * Payment update - in case it's a custom record for co-broker check
 * We just need to load it and update with information we got from APTO
 *
 * @param {APTOPayment} aptoPayment - payment information received from apto
 * @return null - operation should be always successful. Exception would be thrown from NetSuite
 * 		  if record is not found
 */
function updateCoBrokerCheckPayment(aptoPayment)
{
	// Get deposit account id
	var depositAccountId = getBrokerageDepositAccount(aptoPayment.accountingClassification.subsidiary)
	// Extract custom record id
	var recordId;
	var recordType;

	if (aptoPayment.paymentMethod == PAYMENT_METHOD_CO_BROKER_TRUST_CHECK)
	{
		recordId = String(aptoPayment.paymentId).substring(String(PAYMENT_PREFIX_COBROKER_CHECK).length);
		recordType = CUST_RECORD_TYPE_TRUST_COBROKER_PAYMENT;
	}
	else
	{
		recordId = String(aptoPayment.paymentId).substring(String(PAYMENT_PREFIX_WRITE_OFF).length);
		recordType = CUST_RECORD_TYPE_BAD_DEPT_WRITE_OFF;
	}

	nlapiLogExecution("DEBUG","Update Payment","Loading "  + aptoPayment.paymentMethod + " check payment record #" + recordId);

	var payment = nlapiLoadRecord(recordType, recordId);
	// code reuse ... It's not longer init, but would work as well
	initNSCustomPaymentRecord(payment, aptoPayment, depositAccountId);

	// nlapiLogExecution("DEBUG","Amount",payment.getFieldValue("custrecord_cbcr_amount"));

	recordId = nlapiSubmitRecord(payment);

}


/**
 *  Use information stored in the custom record and create actual customer payment from it
 *
 *  @param {nlobjRecord} customPaymentRecord
 *  @returns {nlobjRecord} payment
 */
function createPaymentForCustomPayment(customPaymentRecord, invoiceId)
{
	var payment = null;

	// I want to reuse as much code as possible
	// reusing existing object
	var aptoPayment = new APTOPayment();
	var custRecordName = customPaymentRecord.getRecordType() == CUST_RECORD_TYPE_TRUST_COBROKER_PAYMENT?"cbcr":"bdwo";

	nlapiLogExecution("DEBUG", "Reading Co-Broker Trust Payment Record");
	aptoPayment.populateFromCoBrokerTrustPaymentRecord(customPaymentRecord, custRecordName);
	// AYPC-864
	aptoPayment.paymentMethod = customPaymentRecord.getRecordType() == CUST_RECORD_TYPE_TRUST_COBROKER_PAYMENT?PAYMENT_METHOD_CO_BROKER_TRUST_CHECK:PAYMENT_METHOD_WRITE_OFF;

	nlapiLogExecution("DEBUG", "Getting DEAL ID from invoice", invoiceId);
	var invoice = nlapiLoadRecord(RECORD_TYPE_INVOICE, invoiceId);
	var dealId = invoice.getFieldValue("custbody_deal");
	var arAccount = invoice.getFieldValue("account");

	var invoiceTaxInformation = new InvoiceTaxInformation();

	invoiceTaxInformation.getTaxesFromInvoice(invoice);

	nlapiLogExecution("DEBUG", "Creating NS JE");
	var nsJE = new NSJournalEntry();
	
	nsJE.populateFromAPTOPayment(aptoPayment, dealId, arAccount, invoiceTaxInformation);
	
	//Adding invoice number in the request of co-broker trust payment and bad debit write off payment.
	
	// Deloitte Fix ACES - 640, 693, 713
	var invoiceNum = invoice.getFieldValue("tranid");
	nlapiLogExecution("DEBUG", "invoiceNum",invoiceNum);
	
	nsJE.invoiceNumber = invoiceNum;

	var jeID =  createNetSuiteJE(nsJE);
	var initvalues = [];

	initvalues.entity = aptoPayment.billTo;
	initvalues.recordmode = 'dynamic';

	nlapiLogExecution("DEBUG", "Creating Customer Payment");
	payment = nlapiCreateRecord(RECORD_TYPE_CUST_PAYMENT, initvalues);

	nlapiLogExecution("DEBUG", "Payment record created");

	initNSPaymentRecord(payment, aptoPayment, customPaymentRecord.getFieldValue("custrecord_" + custRecordName + "_deposit_account"), jeID, arAccount);

	customPaymentRecord.setFieldValue("custrecord_" + custRecordName + "_payment_record", jeID);
	return payment;
}

/**
 * Void NS payment
 * @param {APTOPayment} aptoPayment - Apto request
 *
 * @returns {RESTLetResult}
 */
function voidPaymentRecord(aptoPayment)
{
	nlapiLogExecution("DEBUG", "Starting payment void");
	var result = new RESTLetResult();

	try
	{
		voidTransaction(RECORD_TYPE_CUST_PAYMENT, aptoPayment.paymentId);
		result.isSuccess = true;

	}
	catch (e)
	{
		// nlapiLogExecution( 'DEBUG', "Catch of the day", JSON.stringify(e));
		if (e instanceof RESTLetResult)
		{
			nlapiLogExecution( 'DEBUG', "Transaction processing caused an error", e.errorCode);
			result.errorCode =  e.errorCode;

		}
		else if ( e instanceof nlobjError )
		{
			nlapiLogExecution( 'DEBUG', 'NS system error', e.getCode() + ' '  + e.getDetails() );
			result.errorCode = e.getCode();
		}
		else
		{
			nlapiLogExecution("DEBUG", "Error voiding payment", e.name + " " +  e.message);

			result.errorCode = "" + e.name;
		}
		result.isSuccess = false;

	}
	nlapiLogExecution("DEBUG", "Done with voiding payment");
	return result;
}

/**
 *  Void selected customer payment by creating reversing JE and applying it to it
 *
 *  @param {string} payment record internal id
 */
function voidCustomerPaymentViaJE(id)
{
	nlapiLogExecution("DEBUG", "Voding Customer Payment " + id, "Start");

	var transactionInfo = new TransactionInfo();
	transactionInfo.initData(RECORD_TYPE_CUST_PAYMENT, id);
	var jeId = createJEtoReverseGLImpact(transactionInfo);

	nlapiLogExecution("DEBUG", "Reversing JE", jeId + " created");
	var record = nlapiLoadRecord(RECORD_TYPE_CUST_PAYMENT, id);

	associatePaymentAndJE(record, null, jeId); // code re-use - changed function to allow NOT to specify amount

	nlapiSubmitRecord(record);

	nlapiLogExecution("DEBUG", "Voding Customer Payment " + id, "Done");
}

/**
 * Mark custom payment records as inactive
 *
 * @param {string} recordType NetSuite payment record type
 * @param {id} NetSuite internal record id
 */
function markCustomPaymentInactive(recordType, id)
{
	nlapiLogExecution("DEBUG", "Marking " + recordType + " " + id + " inactive",   "Start");

	nlapiSubmitField(recordType, id, 'isinactive', 'T');

	nlapiLogExecution("DEBUG", "Marking " + recordType + " " + id + " inactive",   "Done");
}