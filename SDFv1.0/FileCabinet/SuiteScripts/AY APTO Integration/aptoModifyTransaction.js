/**
 * @summary Library of fuctions handling brokerage transaction adjustment
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       01 Mar 2016     georgem		   Adjustment transaction logic
 * @module aptoModifyTransaction
 *
 * @requires aptoSalesTransactionDefs
 * @requires aptoSalesTransactionLib
 * @requires aptoJE
 */

/**
 * I would like to have a class, that would drive adjustment process
 * For the simple adjustments it's going to be field we need to check in incoming structure
 * Corresponding field in NetSuite invoice record
 * And value we have to populate.
 *
 * I do not think this approach would work for more complicated scenarios, but this is how I would
 * to approach this.
 *
 * @class
 */
APTOTransactionAdjustment = function()
{
	this.aptoFieldName = "";
	this.nsInvoiceFieldName = "";
	this.nsJEHeaderFieldName = "";
	this.nsJELineFieldName = "";
	this.value = null;
}

/**
 * List of adjustment operations
 *
 * @class
 */
APTOWorkList = function()
{
	/**
	 * Initialize Array of objects
	 */
	this.workList = new Array();


	this.addOne = function(aptoFieldName, nsInvoiceFieldName, nsJEFieldName, nsJELineFieldName)
	{
		var aptoTransactionAdj = new APTOTransactionAdjustment();

		aptoTransactionAdj.aptoFieldName = aptoFieldName;
		aptoTransactionAdj.nsInvoiceFieldName = nsInvoiceFieldName;
		aptoTransactionAdj.nsJEFieldName = nsJEFieldName;
		aptoTransactionAdj.nsJELineFieldName = nsJELineFieldName;
		// aptoTransactionAdj.value = value;

		this.workList.push(aptoTransactionAdj);
	}


	// this.addOne('billTo');
	this.addOne('client', 'custbody_client', null, 'custcol_client');
	this.addOne('primaryBrokerId','salesrep', null, 'custcol_employee');

	this.addOne('invoiceDateInMillis','custbody_apto_inovoice_date', null , null);
	//this.addOne('transactionDateInMillis', 'trandate', null, null); //DELOITTE CHANGE JIRA 309 FOR TRANSACTION DATE --> UNCOMMENT IF NOT NEEDED

	this.addOne('terms','terms', null, null);
	//this.addOne('accountingClassification');
	//this.addOne('lines');


	// return hhb      this.workList;


}


/**
 * Perform "simple" transaction adjustments
 * Simple means that invoice is not recreated, just some fields are changed on invoice and journal entries if required
 *
 *
 * @param {Array} todo - list of fields and values to adjust
 * @returns {RESTLetResult} operation result
 */

//function simpleAptoTransactionAdjustment(todo)
//{
//	var result = new RESTLetResult();
//
//
//	if (tansactionRecords != null && tansactionRecords.length > 0)
//	{
//		for (var int = 0; int < tansactionRecords.length; int++) {
//			/**
//			 * @type {NSSearchResults}
//			 */
//			var transactionRecord = tansactionRecords[int];
//
//			nlapiLogExecution("DEBUG", "Voiding " + transactionRecord.kind + " #" + transactionRecord.id);
//
//			voidTransaction(transactionRecord.kind, transactionRecord.id);
//		}
//		result.isSuccess = true;
//	}
//}


/**
 * Modify NS records associated with APTO sales transaction. This function would analize changes presented by Apto
 * and will decide how to handle them
 *
 * @param {APTOSalesTransaction} aptoSalesTransaction List of changes to do for this transaction
 */
function modifySalesTransaction(aptoSalesTransaction)
{
	var result = new RESTLetResult();
	// let's be optimistic and assume that we need to find records that we are going to be adjusting

	nlapiLogExecution("DEBUG", "Searching for records to adjust " + aptoSalesTransaction.invoice.invoiceNo);

	var tansactionRecords = findAPTOinvoiceTransactions(aptoSalesTransaction.invoice.invoiceNo);


	if (tansactionRecords != null && tansactionRecords.length > 0)
	{
		/**
		 * {Array} list of fields and their values (for simple invoice manipulation)
		 */
		var modifications = getSimpleChanges(aptoSalesTransaction);
		/** @type {boolean} **/
		var isUpdateVendor = isVendorUpdate(aptoSalesTransaction);
		/** @type {boolean} **/
		var isTransactionRecreateRequired = isRecreateRequired(aptoSalesTransaction);

		var isJEModificationOnlyRequired = isJEModificationOnly(aptoSalesTransaction);

		//TODO validate that Apto sends null
		var isJENeedToBeRemoved = aptoSalesTransaction.hasOwnProperty('thirdPartyTaxes') &&
		( aptoSalesTransaction.thirdPartyTaxes == null || aptoSalesTransaction.thirdPartyTaxes.length == 0);

		// convert HRIS ID into employee id, so it's done once per adjustment transaction
		if (aptoSalesTransaction.invoice.hasOwnProperty("primaryBrokerId"))
		{
			var emplyeeId = HRISID2EmployeeID(aptoSalesTransaction.invoice.primaryBrokerId);
			nlapiLogExecution("DEBUG", "Employee ID " + emplyeeId);
			aptoSalesTransaction.invoice.primaryBrokerId = emplyeeId;
		}
		// do we have fields passed to us that require to recreate invoice?
		if (isTransactionRecreateRequired)
		{
			nlapiLogExecution("DEBUG", "Recreating APTO sales transaction");
			result = recreateAPTOSalesTransaction(tansactionRecords, aptoSalesTransaction, isJEModificationOnlyRequired);
			tansactionRecords = findAPTOinvoiceTransactions(aptoSalesTransaction.invoice.invoiceNo);
		}

		if (Object.keys(modifications).length > 0)
		{
			nlapiLogExecution("DEBUG", "Performing simple invoice adjustments");
		    modifyNStransactions(tansactionRecords, modifications);
		}

		if (isUpdateVendor)
		{
			nlapiLogExecution("DEBUG", "Updating vendor id");
			updateJEvendorId(tansactionRecords, aptoSalesTransaction.thirdPartyTaxes);
		}


		// AYPC-493 - in order to get adjustmnet date, we need invoice NS id.
		// Let's look at the records involved in this transaction and select an invoice

		var nsInvoiceID = getAnInvoiceID(tansactionRecords);
		result.transactionDateInMillis = getAdjustmentPeriodDateForNSInvoice(nsInvoiceID);

		if (isJENeedToBeRemoved)
		{
			reverseJEifExists(tansactionRecords, new Date(result.transactionDateInMillis));
		}
		result.isSuccess = true;
	}
	else
	{
		result.isSuccess = false;
		result.errorCode = ERROR_CODE_CANNOT_FIND_TRANSACTIONS_TO_ADJUST;
		throw result;
	}

	return result;
}


/**
 * Get list of simple (i.e. operations that do not require invoice recreate in NetSuite)
 * adjustments that we need to do
 *
 * @param {APTOSalesTransaction} aptoSalesTransaction - data from APTO
 * @returns {object} of invoice header fields and values for them
 */
function getSimpleChanges(aptoSalesTransaction)
{

	var workList = new APTOWorkList().workList;
	var invoiceAdjustments = {} ;

	nlapiLogExecution("DEBUG", workList.length + " Adjustment types handled");

	for (var int = 0; int < workList.length; int++) {
		var workItem = workList[int];

		// nlapiLogExecution("DEBUG", JSON.stringify(workItem));

		// If APTO passed us this field - we need to change it on the invoice/je
		if (aptoSalesTransaction.invoice[workItem.aptoFieldName] != null)
		{
			nlapiLogExecution("DEBUG", "Adjusting " + workItem.aptoFieldName);
			if (workItem.nsInvoiceFieldName != null)
			{
				nlapiLogExecution("DEBUG", "Invoice field " + workItem.nsInvoiceFieldName);
				invoiceAdjustments[workItem.nsInvoiceFieldName] = aptoSalesTransaction.invoice[workItem.aptoFieldName];
			}
			if (workItem.nsJEFieldName != null)
			{
				nlapiLogExecution("DEBUG", "JE field " + workItem.nsJEFieldName);
				invoiceAdjustments[workItem.nsJEFieldName] = aptoSalesTransaction.invoice[workItem.aptoFieldName];
			}
			if (workItem.nsJELineFieldName != null)
			{
				nlapiLogExecution("DEBUG", "JE line field " + workItem.nsJELineFieldName);
				invoiceAdjustments[workItem.nsJELineFieldName] = aptoSalesTransaction.invoice[workItem.aptoFieldName];
			}
		}
	}

	nlapiLogExecution("DEBUG",  Object.keys(invoiceAdjustments).length + " adjustments to be made");

	return invoiceAdjustments;
}

/**
 * Check if we were passed vendor update only structure
 * In this case 3rd party taxes structure would have no details.
 *
 * @param {APTOSalesTransaction} aptoSalesTransaction sales transaction information
 * @returns {boolean} true or false based on what has been passed over
 */
function isVendorUpdate(aptoSalesTransaction)
{
	var isUpdate = true;
	nlapiLogExecution("DEBUG", "Checking to see if we have to update vendor id(s) only");

	if (aptoSalesTransaction.hasOwnProperty('thirdPartyTaxes') && aptoSalesTransaction.thirdPartyTaxes != null)
	{
		for (var int = 0; int < aptoSalesTransaction.thirdPartyTaxes.length; int++) {
			var vendorInfo = aptoSalesTransaction.thirdPartyTaxes[int];
			if (vendorInfo.hasOwnProperty('taxes'))
			{
				nlapiLogExecution("DEBUG", "Tax information found");
				isUpdate = false;
				break;
			}

		}
	}
	else
	{
		nlapiLogExecution("DEBUG", "Vendor information is not supplied");
		isUpdate = false;
	}

	return isUpdate;
}

/**
 * Determine if invoice modification is passed in addition to taxes
 *
 * @param {APTOSalesTransaction} aptoSalesTransaction sales transaction information
 * @returns {boolean} true or false based on what has been passed over
 */
function isJEModificationOnly(aptoSalesTransaction)
{
	var isUpdate = false;

	if (aptoSalesTransaction.hasOwnProperty('thirdPartyTaxes') && aptoSalesTransaction.thirdPartyTaxes != null)
	{
		// okay ... we do have data to work on JE
		// if we have more than 2 attributes (invoiceType and invoiceNo are required for processing)
		// it's inovoice adjustment data
		nlapiLogExecution("DEBUG", "JE information Found (" + Object.keys(aptoSalesTransaction.invoice).length + ")" );
		isUpdate = (Object.keys(aptoSalesTransaction.invoice).length == 2);
		nlapiLogExecution("DEBUG", isUpdate?"Only JE needs to be modified":"Invoice needs to be modified");
	}

	return isUpdate;
}
/**
 * Check data passed from APTO and determine if required change could be done by recreate
 *
 * @param {APTOSalesTransaction} aptoSalesTransaction sales transaction information
 * @returns {boolean} true or false based on what has been passed over
 */
function isRecreateRequired(aptoSalesTransaction)
{
	var result = false;

	if (! (isNonAmountChange(aptoSalesTransaction.invoice) ||  isAmountChange(aptoSalesTransaction.invoice)))
	{
		if (aptoSalesTransaction.hasOwnProperty('thirdPartyTaxes') && aptoSalesTransaction.thirdPartyTaxes != null)
		{
			result = ! isVendorUpdate(aptoSalesTransaction);
		}

	}
	else
		result = true;

	if (result)
		nlapiLogExecution("DEBUG", "Transaction recreate required");
	else
		nlapiLogExecution("DEBUG", "Transaction recreate is not required");
	return result;
}

/**
 * Do we have to make a change that does not include change of invoice amount?
 *
 * @param {APTOInvoice} aptoInvoice - invoice changes from APTO
 * @returns {boolean}
 */
function isNonAmountChange(aptoInvoice)
{
	var result = false;
	//DELOITTE FIX - Remove transactionDateInMillis so it does not trigger recreateJournal function 
	var invoiceFields = ['primaryBrokerId',
	                      'accountingClassification',
	                      'billTo'];

	// check to see that we have one of the invoice fields that require recreate
	for (var int = 0; int < invoiceFields.length; int++) {
		var fieldName = invoiceFields[int];
		if (aptoInvoice.hasOwnProperty(fieldName) && aptoInvoice[fieldName] != null)
		{
			result = true;
			break;
		}
	}

	return result;

}
/**
 * Check if this this invoice has line items defined (it's a posibility for amount adjustment)
 *
 * @param {APTOInvoice} aptoInvoice
 * @returns {boolean}
 */
function isAmountChange(aptoInvoice)
{
	var result = false;

	result = (aptoInvoice.hasOwnProperty('lines') && aptoInvoice.lines != null && aptoInvoice.lines.length > 0);

	return result;
}

/**
 * Parse all transactions that are part of this sales record and modify them as needed
 *
 * @param {NSSearchResults[]} tansactionRecords - transactions to process
 * @param {object} modifications - list of modifications
 */
function modifyNStransactions(tansactionRecords, modifications)
{
	for (var int = 0; int < tansactionRecords.length; int++) {
		/**
		 * @type {NSSearchResults}
		 */
		var transactionRecord = tansactionRecords[int];

		nlapiLogExecution("DEBUG", "Modifying " + transactionRecord.kind + " #" + transactionRecord.id);
		try
		{
			adjustNSTransaction(transactionRecord.kind, transactionRecord.id, modifications);
		}
		catch (e)
		{
			if ( e instanceof nlobjError && ((e.getCode() == "99999" || e.getDetails().indexOf("99999") >=0)))
			{
				nlapiLogExecution("DEBUG","Disregarding Error", e.message);
			}
			else
				throw e;
		}

	}
}

/**
 * Apply adjustments to specific NS transaction record
 * <b>NB!</b> Core of adjustment logic is stored in this function
 *
 * @param recordType {string} type of the record
 * @param id  {string}  internal id
 * @param modifications {string[]} array of modifications
 */
function adjustNSTransaction(recordType, id, modifications)
{
	/** @type nlobjRecord */
	var record =  nlapiLoadRecord(recordType, id);
	nlapiLogExecution("DEBUG", "Processing " + recordType);

	for (var fieldName in  modifications)
	{
		nlapiLogExecution("DEBUG","Field Name " + fieldName);
		if (recordType == RECORD_TYPE_INVOICE)
		{
			var dueDate = null;

			var fieldValue = null;

			switch (fieldName) {
				case 'custbody_client':
					fieldValue = modifications[fieldName];
					break;
				case 'salesrep':
					fieldValue = HRISID2EmployeeID(modifications[fieldName]);
					break;
				case 'custcol_employee':
					fieldValue = HRISID2EmployeeID(modifications[fieldName]);
					break;
				//DELOITTE CHANGE JIRA 309 FOR TRANSACTION DATE --> UNCOMMENT IF NOT NEEDED
				/*case 'trandate':
					fieldValue = nlapiDateToString(dateInMillis2date(modifications[fieldName]), DATE_MASK);
					break;*/ 
				case 'custbody_apto_inovoice_date':
					var dueDelta = nlapiStringToDate(record.getFieldValue("duedate")).getTime() -
					          nlapiStringToDate(record.getFieldValue("custbody_apto_inovoice_date")).getTime();

					dueDate = nlapiDateToString(dateInMillis2date(modifications[fieldName] + dueDelta), DATE_MASK);
					fieldValue = nlapiDateToString(dateInMillis2date(modifications[fieldName]), DATE_MASK);
					break;
				case 'terms':
					var invoiceTerms = new InvoiceTerms();
					fieldValue = invoiceTerms.getValue(modifications[fieldName]);
					dueDate = nlapiDateToString(new Date(nlapiStringToDate(record.getFieldValue("custbody_apto_inovoice_date")).getTime() +
							  invoiceTerms.getOffset(modifications[fieldName])), DATE_MASK);
					break;

			}
			if (fieldValue != null)
			{

				//DELOITTE CHANGE JIRA 309 FOR TRANSACTION DATE --> UNCOMMENT IF NOT NEEDED
				/*if (fieldName == "trandate")
				{
					nlapiLogExecution("DEBUG", "Setting invoice transaction date to value " + fieldValue);
					// nlapiLogExecution("DEBUG", "Preserving posting period");
					var dueDate = record.getFieldValue('duedate');
					// var postingPeriod = record.getFieldValue("postingperiod"); // preserving posting period
					record.setFieldValue('trandate', fieldValue); // fieldName
					// record.setFieldValue("postingperiod", postingPeriod);
					//TODO: DUE DATE needs to be discussed
					record.setFieldValue('duedate', dueDate);
				}*/
				if (fieldName == "custbody_apto_inovoice_date")
				{
					nlapiLogExecution("DEBUG", "Setting Apto invoice date", fieldValue + " due date " + dueDate);
					record.setFieldValue('custbody_apto_inovoice_date', fieldValue);
					record.setFieldValue('duedate', dueDate);

				}
				else if (fieldName == "terms")
				{
					record.setFieldValue(fieldName, fieldValue); // set terms
					record.setFieldValue('duedate', dueDate); // set calculated value for the due date
				}
				else if (fieldName == "custcol_employee")
				{
					nlapiLogExecution("DEBUG", "Setting invoice line items custcol_employee to value " + fieldValue);
					var lineCount = record.getLineItemCount(GROUP_TYPE_ITEM);
					nlapiLogExecution("DEBUG", "Updating Invoice Lines ", lineCount);

					for (var int = 1; int <= lineCount; int++) {

						// select line to read/write
						record.selectLineItem(GROUP_TYPE_ITEM, int);
						record.setCurrentLineItemValue(GROUP_TYPE_ITEM,"custcol_employee",fieldValue);
						record.commitLineItem(GROUP_TYPE_ITEM);

						nlapiLogExecution("DEBUG", "Updated Invoice Line", int);
					}
				}
				else
				{
					nlapiLogExecution("DEBUG", "Setting invoice " + fieldName + " to value " + fieldValue);
					record.setFieldValue(fieldName, fieldValue);
				}

			}

		}
		else if (recordType == RECORD_TYPE_JOURNAL_ENTRY)
		{
			var fieldValue = null;

			switch (fieldName) {
				case 'trandate':
					fieldValue = nlapiDateToString(dateInMillis2date(modifications[fieldName]), DATE_MASK);
					nlapiLogExecution("DEBUG", "Setting je " + fieldName + " to value " + fieldValue);
					// nlapiLogExecution("DEBUG", "Preserving posting period");
					// var postingPeriod = record.getFieldValue("postingperiod"); // preserving posting period
					record.setFieldValue(fieldName, fieldValue);
					// record.setFieldValue("postingperiod", postingPeriod);
					break;
				case 'custcol_client':
					fieldValue = modifications[fieldName];
					nlapiLogExecution("DEBUG", "Setting je " + fieldName + " to value " + fieldValue);
					// this is line item field.
					// let's find out how many outstanding invoices do we have
					var lineCount = record.getLineItemCount(GROUP_TYPE_LINE);
					nlapiLogExecution("DEBUG", lineCount + "lines in this je");

					for (var int = 1; int <= lineCount; int++) {
						record.selectLineItem(GROUP_TYPE_LINE, int);
						record.setCurrentLineItemValue(GROUP_TYPE_LINE, fieldName, fieldValue);
						record.commitLineItem(GROUP_TYPE_LINE);
					}

					break;
				case 'custcol_employee':
					// Deloitte fix for ACES-569
					fieldValue = HRISID2EmployeeID(modifications[fieldName]);
					//fieldValue = modifications[fieldName];
					
					nlapiLogExecution("DEBUG", "Setting je " + fieldName + " to value " + fieldValue);
					// this is line item field.
					// let's find out how many outstanding invoices do we have
					var lineCount = record.getLineItemCount(GROUP_TYPE_LINE);
					nlapiLogExecution("DEBUG", lineCount + "lines in this je");

					for (var int = 1; int <= lineCount; int++) {
						record.selectLineItem(GROUP_TYPE_LINE, int);
						record.setCurrentLineItemValue(GROUP_TYPE_LINE, fieldName, fieldValue);
						record.commitLineItem(GROUP_TYPE_LINE);
					}

					break;
			}
		}
		else
		{
			nlapiLogExecution("DEBUG", "Do not know how to adjust this transaction type");
		}


	}


	nlapiSubmitRecord(record);
}

/**
 * Update NetSuite vendor id's on journal entries
 *
 * @param {NSSearchResults[]} tansactionRecords that belongs to this sales transaction
 * @param {TaxParticipant} vendorInfo vendor information
 */
function updateJEvendorId(tansactionRecords, vendorsInfo)
{
	nlapiLogExecution("DEBUG", "Updating JE with vendor IDs");
	for (var int = 0; int < tansactionRecords.length; int++) {
		/**
		 * @type {NSSearchResults}
		 */
		var transactionRecord = tansactionRecords[int];

		if (transactionRecord.kind == RECORD_TYPE_JOURNAL_ENTRY)
		{
			nlapiLogExecution("DEBUG", "Adjusting " + transactionRecord.kind + " #" + transactionRecord.id);
			for (var j = 0; j < vendorsInfo.length; j++) {
				var vendorInfo = vendorsInfo[j];
				nlapiLogExecution("DEBUG", "From " + vendorInfo.aptoVendorId + " To " + vendorInfo.vendorId);
				jeUpdateVendorId(transactionRecord.id, vendorInfo.aptoVendorId, vendorInfo.vendorId);
			}


		}
		else
			nlapiLogExecution("DEBUG", "Skipping " + transactionRecord.kind);

	}
}

/**
 * Go thru list of transactions associated with invoice
 * and reverse them if needed
 *
 * @param {NSSearchResults[]} tansactionRecords that belongs to this sales transaction
 * @param {Date} reversalDate reversal date
 */
function reverseJEifExists(tansactionRecords, reversalDate, processingDate)
{
	nlapiLogExecution("DEBUG", "Searching for JE to reverse");
	for (var int = 0; int < tansactionRecords.length; int++) {
		/**
		 * @type {NSSearchResults}
		 */
		var transactionRecord = tansactionRecords[int];

		if (transactionRecord.kind == RECORD_TYPE_JOURNAL_ENTRY)
		{
			//DELOITTE FIX ACES-705
			var subId = nlapiLookupField(RECORD_TYPE_JOURNAL_ENTRY, transactionRecord.id, 'subsidiary');
			var accountingPeriod = accountingPeriodSearch(reversalDate, subId);
			var enddate = new Date(nlapiLookupField('accountingperiod',accountingPeriod.id,'enddate'));
			var newdate = calculateCorrectTransDate(reversalDate,
						processingDate?processingDate:null, dateInMillis2date(enddate.getTime()));
			reverseJE(transactionRecord.id, newdate);
		}
		else
			nlapiLogExecution("DEBUG", "Skipping " + transactionRecord.kind);

	}
}

/**
 * Recreate previously saved APTO sales transaction
 *
 * @param {NSSearchResults[]} tansactionRecords - array of NS transactions related to this invoice
 * @param {APTOSalesTransaction} aptoSalesTransaction
 * @param {boolean} isJEModificationOnlyRequired - do not touch invoices, modify JE only
 * @returns {RESTLetResult}
 */
function recreateAPTOSalesTransaction(tansactionRecords, aptoSalesTransaction, isJEModificationOnlyRequired)
{
	var result = new RESTLetResult();
	var isJEadjusted = false;


	nlapiLogExecution("DEBUG", "APTO sales transaction adjustment started for invoice " + aptoSalesTransaction.invoice.invoiceNo);

	if (tansactionRecords != null && tansactionRecords.length > 0)
	{
		var adjDate = null; // let's find adjustment date for this transaction
		for (var int = 0; int < tansactionRecords.length; int++) {
			var transactionRecord = tansactionRecords[int];
			if (transactionRecord.kind == RECORD_TYPE_INVOICE)
			{
				var today = new Date().getTime();

				adjDate = getAdjustmentPeriodDateForNSInvoice(transactionRecord.id);
				if (today < adjDate)
					adjDate = today;

				break;
			}
		}


		for (var int = 0; int < tansactionRecords.length; int++) {
			/**
			 * @type {NSSearchResults}
			 */
			var transactionRecord = tansactionRecords[int];

			nlapiLogExecution("DEBUG", "Adjusting " + transactionRecord.kind + " # " + transactionRecord.id);

			if (transactionRecord.kind == RECORD_TYPE_INVOICE )
			{

				if (isJEModificationOnlyRequired)
					result.invoiceId = transactionRecord.id;
				else
				{
					result.invoiceId = recreateInvoice(transactionRecord.id, aptoSalesTransaction.invoice, adjDate);
					nlapiLogExecution("DEBUG", "invoice adj done");
				}

			}
			else if (transactionRecord.kind == RECORD_TYPE_JOURNAL_ENTRY)
			{
				if (isNonAmountChange(aptoSalesTransaction.invoice) ||
						isJEAdjustment(aptoSalesTransaction))
				{
					if (adjDate != null)
						aptoSalesTransaction.transactionDateInMillis = adjDate;

					recreateJournalEntry(transactionRecord.id, aptoSalesTransaction);
					isJEadjusted = true;
				}
				else
					nlapiLogExecution("DEBUG", "No need to adjust JE");

			}
			else
				nlapiLogExecution("ERROR", "Not sure how to handle " + transactionRecord.kind + " as a part of the adjustment");



			result.isSuccess = true;
		}

		if (! isJEadjusted)
		{
			nlapiLogExecution("DEBUG", "JE was not adjusted");
			if (isJEAdjustment(aptoSalesTransaction))
			{
				nlapiLogExecution("DEBUG", "Possibly need to create JE");
				if (! aptoSalesTransaction.invoice.hasOwnProperty("invoiceType"))
				{
					nlapiLogExecution("DEBUG", "Checking invoice type");
					aptoSalesTransaction.invoice.invoiceType = getInvoiceType(result.invoiceId);
				}

				if (aptoSalesTransaction.invoice.invoiceType == INVOICE_TYPE_BILLED_EARNED)
				{
					nlapiLogExecution("DEBUG", "JE has to be created");
					createJEforInvoice(result.invoiceId, aptoSalesTransaction);

				}
			}
		}

	}
	nlapiLogExecution("DEBUG","Done");

	return result;
}

/**
 * Check that passed data has information that would require JE adjustment
 *
 * @param {APTOSalesTransaction} aptoSalesTransaction
 * @returns {Boolean}
 */
function isJEAdjustment(aptoSalesTransaction)
{
	// nlapiLogExecution("DEBUG", "Do we need to adjust JE?:" + JSON.stringify(aptoSalesTransaction.thirdPartyTaxes));

	return aptoSalesTransaction.hasOwnProperty('thirdPartyTaxes') &&
			aptoSalesTransaction.thirdPartyTaxes != null &&
			aptoSalesTransaction.thirdPartyTaxes.length > 0 &&
			aptoSalesTransaction.thirdPartyTaxes[0].hasOwnProperty("taxes")
}

/**
 * Scan search results and return NetSuite internal id
 * of the first invoice found
 *
 * @param {NSSearchResults[]} tansactionRecords
 * @returns {string}
 */
function getAnInvoiceID(tansactionRecords)
{
	var nsInvoiceId = null;

	for (var int = 0; int < tansactionRecords.length; int++) {
		/**
		 * @type {NSSearchResults}
		 */
		var transactionRecord = tansactionRecords[int];

		if (transactionRecord.kind == RECORD_TYPE_INVOICE)
		{
			nsInvoiceId = transactionRecord.id;
			break;
		}
	}

	return nsInvoiceId;
}
