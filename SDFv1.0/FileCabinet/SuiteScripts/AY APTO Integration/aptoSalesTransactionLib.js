/**
 * Library of functions written for apto sales transaction processing
 *
 * Version    Date            Author           Remarks
 * 1.00       06 Jan 2016     georgem		   Externalizing common code to be used by APTO integration
 * @module aptoSalesTransactionLib
 */

/**
 * Wrapper for accounting period information.
 * @class
 */
 //DELOITTE BUILD COMMIT:Sprint 6 PROD deployment 1 
NSAccountingPeriod = function()
{
	this.id = null;
	this.name = null;
	this.startDate = null;
	this.endDate= null
	this.lastSunday = null; //AYPC-1009

	/**
	 * Calculate last Sunday of accounting period month
	 */
	this.calcLastSunday = function()
	{
		//Commenting this out for June last Sunday to be set to 23rd of June - 2019    
		//this.lastSunday = nlapiDateToString( moment(this.endDate).endOf('month').startOf('week').toDate(),  DATE_MASK);
		this.lastSunday = nlapiDateToString( new Date('06/23/2019'),  DATE_MASK);
	}

	/**
	 * Set object data from NS accounting period record
	 * @param {nlobjRecord}
	 */
	this.setData = function(accountingPerid)
	{
		this.id = accountingPerid.getId();
		this.name = accountingPerid.getFieldValue("name");
		this.startDate = accountingPerid.getFieldValue("startdate");
		this.endDate = accountingPerid.getFieldValue("enddate");

		this.calcLastSunday();
	}



}

/**
 * Generic transaction wrapper with validation
 * @param {Object} operation - codeblock
 * @param {Object} validation - codeblock (can be null)

 * @param {APTOTransaction} dataIn data to pass to codeblock
 */
function transactionWrapper(operation, validation, dataIn)
{
	var result = new RESTLetResult();
	nlapiLogExecution("DEBUG", "Error handling wrapper started");


	try
	{
		if (validation != null)
			validation(dataIn);

		result = operation(dataIn);

	}
	catch (e)
	{
		if (e instanceof RESTLetResult)
		{
			nlapiLogExecution( 'AUDIT', "Transaction processing caused an error", e.errorCode);
			result.errorCode =  e.errorCode;

		}
		else if ( e instanceof nlobjError )
		{
			nlapiLogExecution( 'AUDIT', 'system error', e.getCode() + '\n' + e.getDetails() );

			result.errorCode = "NETSUITE_" + e.getCode() + " " + e.getDetails();
		}
		else
		{
			nlapiLogExecution( 'AUDIT', 'Unexpected error', e.toString());
			result.errorCode = "UNEXPECTED_ERROR_" + e.message.replace(/['"]+/g, '');
		}
		nlapiLogExecution("AUDIT", "Processing Error", result.errorCode);

	}
	finally
	{

		if (dataIn != null && dataIn.hasOwnProperty("batchTransactionId") &&  dataIn.batchTransactionId)
		{
			nlapiLogExecution("DEBUG", "Batch id "+  dataIn.batchTransactionId);
			result.batchTransactionId = dataIn.batchTransactionId; // in case we are running in batch mode
		}
		nlapiLogExecution("DEBUG", "Transaction wrapper","done");
		return result;

	}


}

/**
 * Convert HRIS ID into employee's ID
 *
 * @param {string} hrisID
 */
function HRISID2EmployeeID(hrisID)
{

	var filters = new Array();
	var columns = new Array();

	// setup search filter
	filters[0] = new nlobjSearchFilter( 'entityid', null, 'is', hrisID);
	// set columns to return - only need for debugging
	columns[0] = new nlobjSearchColumn('firstname');
	columns[1] = new nlobjSearchColumn('lastname');

	var id = NSSingleIDSearch('employee', filters, columns);

	if (id == null)
	{
		nlapiLogExecution("DEBUG","HRISID2EmployeeID","Not Found");

		result = new RESTLetResult();
		result.errorCode = ERROR_CODE_CANNOT_FIND_HRISID;

		throw result;

	}

	return id;
}

/**
 * Loogkup Deal ID record and return it's internal ID
 *
 * @param {string} dealId APTO DEAL ID (XXXX-XXXX)
 * @returns {string}
 */
function DealID2ID(dealId)
{

	var filters = new Array();
	var columns = new Array();
	
	
	nlapiLogExecution("DEBUG","Deal Id YXY",dealId);
	
	filters[0] = new nlobjSearchFilter( 'externalid', null, 'is', dealId);
	columns[0] = new nlobjSearchColumn('custrecord_deal_Name');

	var id = NSSingleIDSearch('customrecord_deal', filters, columns);

	if (id == null)
	{
		nlapiLogExecution("DEBUG","Not Found DealID2ID");

		result = new RESTLetResult();
		result.errorCode = ERROR_CODE_CANNOT_FIND_DEAL_ID;

		throw result;

	}
	return id;
}
/**
 * Accounting period search for given transaction date
 *
 * @param {Date} postingDate
 * @returns {NSAccountingPeriod}
 */
function accountingPeriodSearch(postingDate,subid)
{
	nlapiLogExecution("AUDIT","accountingPeriodSearch",postingDate + " - " + subid);
	var filters = new Array();
	var columns = new Array();
	var accountingPeriod = null;

	filters[0] = new nlobjSearchFilter( 'arlocked', null, 'is', 'F');
	//filters[0] = new nlobjSearchFilter( 'closed', null, 'isnot', 'T');
	//filters[1] = new nlobjSearchFilter( 'startdate', null, 'onorbefore', postingDate);
    filters[1] = new nlobjSearchFilter( 'enddate', null, 'onorafter', postingDate);
    filters[2] = new nlobjSearchFilter( 'isquarter', null, 'is', 'F');
    filters[3] = new nlobjSearchFilter( 'isyear', null, 'is', 'F');
    filters[4] = new nlobjSearchFilter( 'isadjust', null, 'is', 'F');
    filters[5] = new nlobjSearchFilter( 'isinactive', null, 'is', 'F');

	columns[0] = new nlobjSearchColumn('periodname');
	columns[1] = new nlobjSearchColumn('startdate').setSort();
	columns[2] = new nlobjSearchColumn('enddate');
    columns[3] = new nlobjSearchColumn('isquarter');
    columns[4] = new nlobjSearchColumn('isyear');

	// var id = NSSingleIDSearch(RECORD_TYPE_ACCOUNTING_PERIOD, filters, columns);
	var searchresults = nlapiSearchRecord(RECORD_TYPE_ACCOUNTING_PERIOD, null, filters, columns);

	if (searchresults != null && searchresults.length > 0)
	{	
		var searchresult = searchresults[periodSubsidiarySearchWrapper(searchresults, subid)];
		accountingPeriod = new NSAccountingPeriod();
		accountingPeriod.id = searchresult.getId();
		accountingPeriod.name = searchresult.getValue(columns[0]);
		accountingPeriod.startDate = searchresult.getValue(columns[1]);
		accountingPeriod.endDate = searchresult.getValue(columns[2]);
		nlapiLogExecution("DEBUG", postingDate + "accountingPeriodSearch Posting Period", JSON.stringify(accountingPeriod));
	}
	else
	{
		nlapiLogExecution("DEBUG","Not Found accountingPeriodSearch");
		result = new RESTLetResult();
		result.errorCode = ERROR_CODE_CANNOT_FIND_POSTING_PERIOD;
		throw result;
	}
	return accountingPeriod;
}
//TODO:Wrapper 
function periodSubsidiarySearchWrapper(searchresults,subid){
	if(!subid){//if subid or searchresults has nothing is absent always return the first period
		nlapiLogExecution("DEBUG","Subsidiary Not found so returning the first open period");
		return 0;
	}
	var i=0;
	var searchresult = searchresults[i];
	while(i<searchresults.length){//iterate over the periods list to find the open period for subsidiary and period
		searchresult = searchresults[i];
		var id = searchresult.getId();
		if(periodSubsidiarySearch(id,subid)){
			nlapiLogExecution("DEBUG","Period and Subsidiary Match",id + "  " + subid);
			return i;
		}
		i++;
	}
	//Iterated the whole results but no match was found so moving the period to the first open period
	if(i == searchresults.length){
		nlapiLogExecution("DEBUG","Iterated the whole results but no match was found so moving the period to the first open period","Sub:"+subid);
		return 0;
	}
}

//TODO:need to be scaled for AP/AP/All Locked also
function periodSubsidiarySearch(period,subid){
	var columns = [
		   new nlobjSearchColumn("period").setSort(false), 
		   new nlobjSearchColumn("subsidiary"), 
		   new nlobjSearchColumn("itemtype"), 
		   new nlobjSearchColumn("complete")
		];
	var taskitemstatusSearch = nlapiSearchRecord("taskitemstatus",null,
		[
		   ["itemtype","anyof","PCP_LOCK_AR"], 
		   "AND", 
		   ["period","abs",period], 
		   "AND", 
		   ["subsidiary","anyof",subid]
		], 
		columns
		);
	
	//The current period is open for subsidiary
	if(taskitemstatusSearch && taskitemstatusSearch.length==1){
		var complete = taskitemstatusSearch[0].getValue(columns[3]);
		nlapiLogExecution("DEBUG","Verifying Period and Subsidiary", period + " -- " + subid + " ==> " + complete);
		if(complete.toUpperCase() === "F")
			return true;
		else
			return false;
	}
	else{
		nlapiLogExecution("DEBUG","Verifying Period and Subsidiary", "No results" );
        //DELOITTE FIX for the bug in ACES 480[this code was not moved to SB2]
		return true;
	}
}
/**
 * Accounting period search for adjustment using transaction date
 *
 * @param {date} postingDate
 * @returns {NSAccountingPeriod} accountingPerid
 */
function adjustmentAccountingPeriodSearch(postingDate,subid)
{
	var filters = new Array();
	var columns = new Array();
	var accountingPeriod = null;

	nlapiLogExecution("AUDIT","Adjustment Period Search", postingDate + " " + subid);

	filters[0] = new nlobjSearchFilter( 'arlocked', null, 'is', 'F');
	//filters[0] = new nlobjSearchFilter( 'closed', null, 'isnot', 'T');
	// filters[1] = new nlobjSearchFilter( 'startdate', null, 'onorafter', postingDate);
    filters[1] = new nlobjSearchFilter( 'enddate', null, 'onorafter', postingDate);
    filters[2] = new nlobjSearchFilter( 'isquarter', null, 'is', 'F');
    filters[3] = new nlobjSearchFilter( 'isyear', null, 'is', 'F');
    filters[4] = new nlobjSearchFilter( 'isadjust', null, 'is', 'F');
    filters[5] = new nlobjSearchFilter( 'isinactive', null, 'is', 'F');


	columns[0] = new nlobjSearchColumn('periodname');
	columns[1] = new nlobjSearchColumn('startdate').setSort();
	columns[2] = new nlobjSearchColumn('enddate');
    columns[3] = new nlobjSearchColumn('isquarter');
    columns[4] = new nlobjSearchColumn('isyear');

    var searchresults = nlapiSearchRecord(RECORD_TYPE_ACCOUNTING_PERIOD, null, filters, columns);
    
	if (searchresults != null)
	{
		var searchresult = searchresults[periodSubsidiarySearchWrapper(searchresults, subid)];
		
		nlapiLogExecution("DEBUG","Accounting Period ID",  + searchresult.getId());

		accountingPeriod = new NSAccountingPeriod();

		accountingPeriod.id = searchresult.getId();
		accountingPeriod.name = searchresult.getValue(columns[0]);
		accountingPeriod.startDate = searchresult.getValue(columns[1]);
		accountingPeriod.endDate = searchresult.getValue(columns[2]);

		accountingPeriod.calcLastSunday();
	}
	else
	{
		nlapiLogExecution("DEBUG","Not Found adjustmentAccountingPeriodSearch");

		result = new RESTLetResult();
		result.errorCode = ERROR_CODE_CANNOT_FIND_POSTING_PERIOD;

		throw result;

	}
	nlapiLogExecution("DEBUG", "adjustmentAccountingPeriodSearch Posting Period", JSON.stringify(accountingPeriod));
	return accountingPeriod;
}
/**
 * This will return the correct transadate based on the posting period enddate,transdate,processingdate[this is a new parameter in the transaction json from APTO]
 *
 * @param {JSON} transaction json from APTO
 * @param {JSON} the accounting period with the enddate object
 * @returns {date} the actual transation date that is supposed to set on the transaction   
 * 
 */
//Deloitte Jira 309:date function for calculating the correct trandate 
/*
If the processingDateInMillis IS NULL and the transactionDateInMillis is greater than the last day of the earliest open period then use this date as the transaction date
If the processingDateInMillis IS NOT NULL and the processingDateInMIllis is less than or equal to the last day of the earliest open period then use the processingDataInMillis as the transaction date
If the processingDateInMillis IS NOT NULL and greater than the last day of the earliest open period then use the last day of the earliest open period as the transaction date.
*/
function calculateCorrectTransDate(trandate,processingdate,enddate){
	enddate = enddate?enddate.getTime():null;//this will never be null
	processingdate = processingdate?processingdate.getTime():null;
	trandate = trandate?trandate.getTime():null;//this will never be null
		nlapiLogExecution("DEBUG", "3 dates are:", "enddate - " + enddate + " trandate - " + trandate + " processingdate - "+processingdate);
	var date = trandate;//default date on the transaction will always be trandate
	if(!processingdate && trandate && trandate>enddate){
		date = trandate;
	}
	else if(processingdate && processingdate<=enddate){
		date = processingdate;
	}
	else if(processingdate && processingdate>enddate){
		date = enddate;
	} 
	nlapiLogExecution("AUDIT", "TRANDATE IS", date);
	return new Date(date);
}


/**
 * Search for ID using type of the record, columns and filters
 *
 * @param {string} kind NetSuite entity type
 * @param {Array} filters set of filters to use in search
 * @param {Array} columns columns we would like search to return
 * @returns {string} id of the record if found
 */
function NSSingleIDSearch(kind, filters, columns)
{
	var id = null;
	var searchresults = nlapiSearchRecord(kind, null, filters, columns);

	if (searchresults != null && searchresults.length == 1)
	{

		var searchresult = searchresults[0];
		id = searchresult.getId();

		nlapiLogExecution("DEBUG","ID " + searchresult.getId());
	}
	else
	{
		nlapiLogExecution("DEBUG", kind + " Not found NSSingleIDSearch");
	}

	return id;
}

/**
 * Search for multiple transaction records in NetSuite
 *
 * @param {string} kind NetSuite entity type
 * @param {Array} filters set of filters to use in search
 * @param {Array} columns columns we would like search to return
 * @returns {Array} of {NSSearchResults}
 */
function NSTransactionSearch(filters, columns)
{
	var results = new Array();
	var searchresults = nlapiSearchRecord('transaction', null, filters, columns);

	if (searchresults != null && searchresults.length >0)
	{
		// we got some results - we should not get anything back only if all records were voided already
		for (var int = 0; int < searchresults.length; int++) {
			var searchresult = searchresults[int];
			var nsSearchResult = new  NSSearchResults(searchresult.getRecordType(), searchresult.getId());

			nlapiLogExecution("DEBUG","Kind " + nsSearchResult.kind +  " id " + nsSearchResult.id );

			// did we find this record already?
			var obj = results.filter(function (obj) {
				return obj.id === nsSearchResult.id;
			})[0];


			if (obj == null) // if not - store it in results array
				results.push(nsSearchResult);
		}


	}

	return results;
}
/**
 * Some code protection - handling date in both epoch and milliseconds
 *
 * @param {string} dataInMillis data in milliseconds from 1970
 * @returns {Date}
 */
function dateInMillis2date(dateInMillis)
{
	// drop decimals if we have it
	// dateInMillis = dateInMillis.toFixed(0);

	// is it time since 1970 in seconds? (I do understand this code would not work for dates prior to 1970)
	if (dateInMillis.toString().length == 10)
		dateInMillis = dateInMillis * 1000 // convert into milliseconds

	var utc = new Date(dateInMillis);
	var date = new Date(utc.getTime() + utc.getTimezoneOffset() * 60000);

	// nlapiLogExecution("DEBUG","Date Conversion : "+ dateInMillis + " " + date  );
	return date;
}

/**
 * Find all records associated with given invoice id
 * @param {string} aptoInvoiceNo - APTO invoice number
 * @returns {Array} array of {NSSearchResults}
 */
function findAPTOinvoiceTransactions(aptoInvoiceNo)
{
	nlapiLogExecution("DEBUG","Searching for records associated with APTO invoice ",aptoInvoiceNo);
	var filterExpression = [['custbody_apto_invoice', 'is', aptoInvoiceNo], 'and',
	[['mainline','is','T'], 'and',
	[["amount","greaterthan","0.00"], 'or', [["amount","equalto","0.00"], 'and', ['tranid', 'doesnotcontain', 'ADJ']]], 'and',
	 ['recordtype', 'is', 'invoice'],
	  'or',
	 [['recordtype', 'is', 'journalentry'], 'and', ['reversaldate', 'isempty', null]],
	 'and', ['isreversal', 'is', 'F'], 'and', ["custbody_apto_payment_number","isempty",""] ]];

//Deloitte Fix ACES-640 , 713
	var columns = new Array();

	columns[0] = new nlobjSearchColumn('custbody_apto_invoice');
	columns[1] = new nlobjSearchColumn('amountremaining');

	var results = new Array();
	var searchresults = nlapiSearchRecord('transaction', null, filterExpression, columns);

	if (searchresults != null && searchresults.length >0)
	{
		// we got some results - we should not get anything back only if all records were voided already
		for (var int = 0; int < searchresults.length; int++) {
			var searchresult = searchresults[int];
			var isUsable = false;

			if (searchresult.getRecordType() == 'invoice')
			{
				if (searchresult.getValue(columns[1]) > 0)
				{
					// this invoice has not being paid off - nothing else has to be done
					isUsable = true;
				}
				else
				{
					var invoice = nlapiLoadRecord(searchresult.getRecordType(), searchresult.getId());
					// need to check if this invoice was paid off by APTO milestone process
					isUsable = ! invoiceNotMilestoned(invoice);
				}
			}
			else
			{
				// this is journal entry
				isUsable = true;
			}
			if (isUsable)
			{
				var nsSearchResult = new  NSSearchResults(searchresult.getRecordType(), searchresult.getId());
				results.push(nsSearchResult);
			}

			var transactionId = searchresults[int].getId();

			do {
				int++

			} while (int < searchresults.length && transactionId == searchresults[int].getId());
			int--;

		}
	}
	// ['amountremaining', 'greaterthan', '0']


	if (results != null && results.length > 0)
	{
		nlapiLogExecution("DEBUG", "Done", results.length + " record found");
	}

	return results;

}

/**
 * Check that this paid invoice has been offset by APTO milestone processing
 *
 * @param {nlobjRecord} invoice
 * @returns {Boolean}
 */
function invoiceNotMilestoned(invoice)
{
	var isMilestoned = false;

	// check links to see if this invoice has been paid by credit memo
	var lineCount = invoice.getLineItemCount(GROUP_TYPE_LINKS);
	var cmMemos = new CMMemos();
	var aptoMemos = cmMemos.getValues();

	for (var int = 1; int <= lineCount; int++) {
		invoice.selectLineItem(GROUP_TYPE_LINKS, int);
		if (invoice.getCurrentLineItemValue(GROUP_TYPE_LINKS,"type") == "Credit Memo")
		{
			var creditMemo = nlapiLoadRecord(RECORD_TYPE_CREDIT_MEMO, invoice.getCurrentLineItemValue(GROUP_TYPE_LINKS,"id") );

			nlapiLogExecution("DEBUG","CM Memo check",creditMemo.getFieldValue("memo"));


			isMilestoned = aptoMemos.indexOf(creditMemo.getFieldValue("memo")) >= 0;

			if (isMilestoned) // found it - don't need to do anything else
			{
				nlapiLogExecution("DEBUG","CM Memo check","Found credit memo created by milestone process");
				break;
			}
		}

	}
	return isMilestoned;
}
function findWriteOffPaymentTransactions()
{
	nlapiLogExecution("DEBUG","Search","Write-off payments to offset");

	var filters = [['recordtype', 'is', 'customerpayment'],
	               'and', ['account', 'is', ACCOUNT_ZBA_BAD_DEBT_WRITE_OFF_EXPENSE],
	               'and', ['custbody_ay_sweep_je_id', 'isempty']];


	var columns = new Array();

	// columns[0] = new nlobjSearchColumn('custbody_apto_invoice');

	var searchresults = NSTransactionSearch(filters, columns);

	if (searchresults != null && searchresults.length > 0)
	{
		nlapiLogExecution("DEBUG", "Found", searchresults.length + " record(s)");
	}

	return searchresults;

}
/**
 * Find NS invoice by id and identify it's type
 *
 * @param {string} invoiceId
 * @returns {string}
 */
function getInvoiceType(invoiceId)
{
	var invoiceType = "";

	nlapiLogExecution("DEBUG", "Loading invoice " + invoiceId);

	var invoice = nlapiLoadRecord(RECORD_TYPE_INVOICE, invoiceId);

	switch (invoice.getFieldValue(account)) {
	case ACCOUNT_REC_BILLED_EARNED:
		invoiceType = INVOICE_TYPE_BILLED_EARNED;
		break;
	case ACCOUNT_REC_UNBILLED_EARNED:
		invoiceType = INVOICE_TYPE_UNBILLED_EARNED;
		break;
	case ACCOUNT_REC_UNBILLED_UNEARNED:
		invoiceType = INVOICE_TYPE_UNBILLED_UNEARNED;
		break;
	default:
		break;
	}
	nlapiLogExecution("DEBUG", "Invoice Type: " + invoiceType);
	return invoiceType;
}

/**
 * Find check matching amount and number printer in the given subsidiary
 *
 * @param {string} subsidiaryId
 *
 * @param {string} checkNumber
 * @param {string} checkCurrency
 * @param {string} checkAmount
 *
 * @returns {string} NS internal id of the record
 */
function getCheckId(subsidiaryId, checkNumber, checkCurrency, checkAmount)
{
	var checkId = null;
	var columns = new Array();

	var filters = [['recordtype', 'is', 'check'],
	               'and',
	               ['subsidiary', 'is', subsidiaryId],
	               'and',
	               ['tranid', 'is', checkNumber],
	               'and',
	               ['mainline','is', 'T']];

	nlapiLogExecution("DEBUG","Search", JSON.stringify(filters)); // "Check record for #" + checkNumber + " for $" + checkAmount

	columns[0] = new nlobjSearchColumn('total');
	columns[1] = new nlobjSearchColumn('currency');

	var searchresults = nlapiSearchRecord('transaction', null,  filters, columns);

	nlapiLogExecution("DEBUG","Search Result", JSON.stringify( nlapiSearchRecord('transaction', null, filters, columns)));

	if (searchresults != null && searchresults.length > 0)
	{
		nlapiLogExecution("DEBUG", "Found", searchresults.length + " record(s)");

		for (var int = 0; int < searchresults.length; int++) {

			var searchresult = searchresults[int];

			nlapiLogExecution("DEBUG", "Check Amount", searchresult.getValue('currency') +
					" " + searchresult.getValue('total'));

			if (math.bignumber(searchresult.getValue('total')).absoluteValue().equals(math.bignumber(checkAmount)) &&
					searchresult.getValue('currency') == checkCurrency)
			{
				checkId = searchresults[0].getId();
				break;
			}

		}

	}
	return checkId;
}

/**
 * Get brokerage deposit account (NetSuite id)
 * for the given subsidiary
 *
 *  @param  {Sting} subsidiaryId - NetSuite internal ID of subsidiary record
 *  @return {string} - NetSuite internal ID of account
 *
 *  @throws  {RESTLetResult} - in case account is not configured
 */
function getBrokerageDepositAccount(subsidiaryId)
{
	var subsidiary = nlapiLoadRecord(RECORD_TYPE_SUBSIDIARY, subsidiaryId);

	var depositAccountId = subsidiary.getFieldValue("custrecord_brokerage_deposit_acct");

	if (depositAccountId == null || depositAccountId == "")
	{
		nlapiLogExecution("ERROR", "Deposit account not configured", "Subsidiary " + subsidiaryId + " " + subsidiary.getFieldValue("name"));
		var result = new RESTLetResult();
		result.isSuccess = false;
		result.errorCode = ERROR_CODE_DEPOSIT_ACCT_NOT_CONFIGURED + "_" + subsidiary.getFieldValue("name");
		throw result;
	}

	return depositAccountId;
}

/**
 * Get subsidiary mapping id from <b>customrecord_subsidiary_map</b>
 *
 * @param {string} subsidiaryId
 */
function getSubsidairyMappingId(subsidiaryId)
{
	var mapId = null;

	//let's create a search
	var subsidiaryMapRecord = null;

	var filterExpression = [['custrecord_subsidiary_map', 'is', subsidiaryId]];

	var results = nlapiSearchRecord("customrecord_subsidiary_map", null, filterExpression, []);

	if (results != null && results.length > 0)
	{
		mapId = results[0].getId();
	}

	return mapId;
}

Date.prototype.YYYYMMDDHHMMSS = function () {
    var yyyy = this.getFullYear().toString();
    var MM = pad(this.getMonth() + 1,2);
    var dd = pad(this.getDate(), 2);
    var hh = pad(this.getHours(), 2);
    var mm = pad(this.getMinutes(), 2)
    var ss = pad(this.getSeconds(), 2)

    return yyyy + MM + dd+  hh + mm + ss;
};

function pad(number, length) {

    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }

    return str;

}

/**
 * NetSuite transaction information wrapper
 *
 * @class
 */
TransactionInfo = function()
{
	this.recordType = null;
	this.id = null;
	this.tranId = null;
	this.entity = null;
	this.subsidiary = null;
	this.currency = null;

	/**
	 * Constructor - load data from transaction
	 * @param {string} recordType NetSuite transaction recordType
	 * @param {string} id NetSuite internal record id
	 */
	this.initData = function(recordType, id)
	{
		this.recordType = recordType;
		this.id = id;
		var entityfieldname =  "entity"; // nlapiLookupField(this.recordType, this.id, "entityfieldname");
		var columns = nlapiLookupField(this.recordType, this.id, ["subsidiary", "currency", "tranid", entityfieldname]);

		this.subsidiary = columns.subsidiary;
		this.currency = columns.currency;
		this.tranId = columns.tranid;

		this.entity = columns[entityfieldname];
	}
}
/**
 * Generic restlet log wrapper
 * @class
 */
RESTLetInfo = function ()
{
	this.restletName = "";
	this.restletHTTPMethod = "";

	this.uuid = UUID.generate();

	this.logTitle = this.uuid;
	this.dataIn = "";


	/**
	 * Log restlet invocation. Shall be called as soon as restlet code started
	 */
	this.logInvocation = function(restletName, restletHTTPMethod, dataIn)
	{
		this.restletName = restletName;
		this.restletHTTPMethod = restletHTTPMethod;
		this.dataIn = dataIn;

		this.logTitle = this.restletName + " [" + this.restletHTTPMethod + "] " +  this.uuid;

		nlapiLogExecution("AUDIT", this.logTitle, "Input :" +  JSON.stringify(this.dataIn));
	}
	/**
	 * Log restlet execution error
	 * @param {Object} result
	 */
	this.logError = function(result)
	{
		var record = nlapiCreateRecord("customrecord_ay_apto_int_errors");

		record.setFieldValue("custrecord_ay_apto_restlet_name", this.restletName);
		record.setFieldValue("custrecord_ay_apto_http_method", this.restletHTTPMethod);
		record.setFieldValue("custrecord_ay_apto_uuid", this.uuid);
		record.setFieldValue("custrecord_ay_apto_input", JSON.stringify(this.dataIn));
		record.setFieldValue("custrecord_ay_apto_response", JSON.stringify(result));

		if (result.hasOwnProperty("errorCode"))
		{
			record.setFieldValue("custrecord_ay_apto_error", result.errorCode);
		}
		// record.setFieldValue("custrecord_ay_apto_error_date", new Date()); /// nlapiDateToString(new Date(), DATE_MASK)


		var recordId = nlapiSubmitRecord(record);
	}

	/**
	 * Log End of Execution
	 *
	 * @param {RESTLetResult} result
	 */
	this.logEOE = function(result)
	{
		nlapiLogExecution("AUDIT", this.logTitle, "Output :" +  JSON.stringify(result));
		if (result.hasOwnProperty("isSuccess") && ! result.isSuccess)
			this.logError(result)
	}
}

/**
 * Fast UUID generator, RFC4122 version 4 compliant.
 * @class
 * @author Jeff Ward (jcward.com).
 * @license MIT license
 * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
 **/
var UUID = (function() {
  var self = {};
  var lut = []; for (var i=0; i<256; i++) { lut[i] = (i<16?'0':'')+(i).toString(16); }
  self.generate = function() {
    var d0 = Math.random()*0xffffffff|0;
    var d1 = Math.random()*0xffffffff|0;
    var d2 = Math.random()*0xffffffff|0;
    var d3 = Math.random()*0xffffffff|0;
    return lut[d0&0xff]+lut[d0>>8&0xff]+lut[d0>>16&0xff]+lut[d0>>24&0xff]+'-'+
      lut[d1&0xff]+lut[d1>>8&0xff]+'-'+lut[d1>>16&0x0f|0x40]+lut[d1>>24&0xff]+'-'+
      lut[d2&0x3f|0x80]+lut[d2>>8&0xff]+'-'+lut[d2>>16&0xff]+lut[d2>>24&0xff]+
      lut[d3&0xff]+lut[d3>>8&0xff]+lut[d3>>16&0xff]+lut[d3>>24&0xff];
  }
  return self;
})();

