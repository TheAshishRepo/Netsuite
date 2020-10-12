/**
 * Library of functions related to identifying adjustment accounting period for a given transaction
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       02 Aug 2016     georgem		   initial version
 * @requires aptoSalesTransactionDefs
 * @requires aptoSalesTransactionLib
 *
 * @module aptoGetAdjPostingPeriodScript
 */


/**
 * Get posting period for adjustment
 * By finding existing invoice and examining it's posting period
 *
 * @param {APTOGetPostingPeriodRequest} aptoRequest
 * @returns {APTOGetPostingPeriodResponse} list of inovices and corresponding end of the accounting period date
 */
function getInvoiceAdjustmentPostingPeriod(aptoRequest)
{
	nlapiLogExecution("DEBUG", "Adjustment Period","Starting process");
	var result = new APTOGetPostingPeriodResponse();

	result.batchTransactionId = aptoRequest.batchTransactionId;

	if (aptoRequest.hasOwnProperty("invoices")
			&& aptoRequest.invoices != null
			&& aptoRequest.invoices.length > 0)
	{
		for (var int = 0; int < aptoRequest.invoices.length; int++)
		{
			var invoice = new APTOGetPostingPeriodRequestInvoice();

			invoice.nsInvoiceId = aptoRequest.invoices[int].nsInvoiceId;
			invoice.transactionDateInMillis = getAdjustmentPeriodDateForNSInvoice(invoice.nsInvoiceId);

			result.invoices.push(invoice);
		}
	}
	else
	{
		nlapiLogExecution("DEBUG", "Missing mandatory parameter - invoices","Exiting");
		var error = new RESTLetResult();
		error.isSuccess = false;
		error.code = ERROR_CODE_MISSING_INVOICE;
		throw error;
	}

	nlapiLogExecution("DEBUG", "Adjustment Period","Done");

	return result;
}

/**
 * Find adjustment period for NetSuite invoice
 * @param {string} nsInvoiceId - NetSuite invoice internal ID
 * @returns {number} last day of accounting period usable for adjustment (in millis)
 */
function getAdjustmentPeriodDateForNSInvoice(nsInvoiceId)
{

	var result = getAdjustmentPeriodDateForNSRecord(RECORD_TYPE_INVOICE, nsInvoiceId)

	return result;
}

/**
 * Find posting period to be used for adjusting selected invoice
 * @param {string} nsInvoiceId NS invoice internal id
 * @returns {nlobjRecord} posting period record
 */
function getAdjPeriodForNSInvoice(nsInvoiceId)
{

	var postingPeriod = getAdjPeriodForNSTransaction(RECORD_TYPE_INVOICE, nsInvoiceId);
    return postingPeriod;
}

/**
 * Find adjustment period for NetSuite transaction
 *
 * @param {string} nsRecordType NS record type
 * @param {string} nsRecordId - NetSuite record internal ID
 *
 * @returns {number} last day of accounting period usable for adjustment (in millis)
 */
function getAdjustmentPeriodDateForNSRecord(nsRecordType, nsRecordId)
{
	nlapiLogExecution("DEBUG", "Getting adjustment date for " + nsRecordType + " adjustment");
	var postingPeriodEndDate = null;

	var postinPeriod = getAdjPeriodForNSTransaction(nsRecordType, nsRecordId);

    postingPeriodEndDate = postinPeriod.getFieldValue('enddate');
    nlapiLogExecution("DEBUG", "Adjustmnent Period", postinPeriod.getFieldValue('periodname') + " " + postingPeriodEndDate);
    result = nlapiStringToDate(postingPeriodEndDate, DATE_MASK).getTime();

	return result;
}

/**
 * Check if item is in open accounting period
 * @param {string} recordType - NetSuite transaction record type
 * @param {string} id - NetSuite internal record id
 *
 * @returns {boolean}
 */
//DELOITTE FIX for ACES 480 - Querying this based on subid and period.Earlier this was just being done on period  
function itemInOpenPeriod(recordType, id)
{
	var isPeriodOpen = false;

	// let's get period id from the item
	var arr = nlapiLookupField(recordType, id, ["postingperiod","subsidiary"]);
	var period = arr['postingperiod'];
	var subid = arr['subsidiary'];
	nlapiLogExecution("DEBUG", recordType + " " + id, period);

	// most generic case
	var field = "alllocked";

	// is it AR transaction?
	if (recordType == RECORD_TYPE_CUST_PAYMENT || recordType == RECORD_TYPE_INVOICE || recordType == RECORD_TYPE_CUST_REFUND)
		field = "arlocked";
	else if (recordType.includes("vendor")) // AP transaction type? (all start with word "vendor"
		field = "aplocked";
	//TODO:this has to be discussed with Kevin
	//isPeriodOpen = nlapiLookupField(RECORD_TYPE_ACCOUNTING_PERIOD, period, field) == "F";
	isPeriodOpen = periodSubsidiarySearch(period,subid);
	nlapiLogExecution("DEBUG", "itemInOpenPeriod " + period + "  " + subid , isPeriodOpen);
	return isPeriodOpen;
}
/**
 * Find posting period to be used for adjusting selected record
 *
 * @param {string} nsRecordType NS record type
 * @param {string} nsRecordId NS transaction record internal id
 * @returns {nlobjRecord} posting period record
 */
function getAdjPeriodForNSTransaction(nsRecordType, nsRecordId)
{
	var arr = nlapiLookupField(nsRecordType, nsRecordId, ['postingperiod','subsidiary']);
	var postingPeriodId = arr['postingperiod'];
	var postingPeriod = null;

    if (itemInOpenPeriod(nsRecordType, nsRecordId))
    {
    	nlapiLogExecution("DEBUG", "Accounting period is still open");
    }
    else
    {
    	var endDate = nlapiLookupField(RECORD_TYPE_ACCOUNTING_PERIOD, postingPeriodId,'enddate');
    	postingPeriodId = adjustmentAccountingPeriodSearch(endDate,arr['subsidiary']).id;

    }
    postingPeriod = nlapiLoadRecord(RECORD_TYPE_ACCOUNTING_PERIOD, postingPeriodId);

    return postingPeriod;
}