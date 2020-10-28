/**
 * @summary Library of function to manipulate NetSuite invoices
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       23 Dec 2015     georgem		   Initial version
 * @module aptoInvoice
 *
 * @requires aptoSalesTransactionDefs
 * @requires aptoSalesTransactionLib
 * @requires aptoVoidTransaction
 *
 */
 // testing on 10/28
/**
 * @classdesc Information from original invoice that we would need
 * when we are creating a new one
 * @class
 */
APTOInvoiceHeaderInformation = function()
{
	this.invoiceDate;
	this.dueDate;
	this.tranDate;
	this.currency;

	this.accountingClassification = new AccountingClassification();

	/**
	 * Read data from NetSuite invoice record
	 * @param {string} invoiceId - NS invoice Internal ID
	 */
	this.readFromInvoice = function(invoiceId)
	{
		var fields = ["custbody_apto_inovoice_date", "duedate", "trandate", "currency"];

		var columns = nlapiLookupField(RECORD_TYPE_INVOICE, invoiceId, fields);

		this.invoiceDate = columns.custbody_apto_inovoice_date;

		this.dueDate = columns.duedate;
		this.tranDate = columns.trandate;
		this.currency = columns.currency;

		this.accountingClassification.populateFromNSInvoice(invoiceId);

	}

	/**
	 * Save data into NetSuite invoice record
	 * @param {nlobjRecord} invoice - loaded NS invoice record
	 */
	this.saveToInvoice = function(invoice)
	{

		invoice.setFieldValue("custbody_apto_inovoice_date", this.invoiceDate);
		invoice.setFieldValue("trandate", this.tranDate);
		invoice.setFieldValue("currency", this.currency);
		invoice.setFieldValue("duedate", this.dueDate);
	}
}

/**
 * Populate NS invoice header
 *
 * @param {APTOInvoice} aptoInvoice
 * @param {nlobjRecord} record NS record of "invoice" type
 * @record invoice
 * @param {RESTLetResult} result
 */
function createNSInvoiceHeader(aptoInvoice, record, result)
{
	nlapiLogExecution("DEBUG","external id");
	record.setFieldValue("externalid", aptoInvoice.transactionId);
	nlapiLogExecution("DEBUG","transaction id");
	record.setFieldValue("tranid", aptoInvoice.invoiceNo);

	nlapiLogExecution("DEBUG","APTO invoice");
	record.setFieldValue("custbody_apto_invoice", aptoInvoice.invoiceNo);

	nlapiLogExecution("DEBUG","Sub " + aptoInvoice.accountingClassification.subsidiary);
	record.setFieldValue("subsidiary", aptoInvoice.accountingClassification.subsidiary);

	nlapiLogExecution("DEBUG","Dept");
	record.setFieldValue("department", aptoInvoice.accountingClassification.department);
	nlapiLogExecution("DEBUG","Location");
	record.setFieldValue("location", aptoInvoice.accountingClassification.market) // market/cost center
	nlapiLogExecution("DEBUG","Class");
	record.setFieldValue("class",aptoInvoice.accountingClassification.category); // category

	var receivableAccounts = new AccountRecAccounts();
	nlapiLogExecution("DEBUG","Rec. Account");
	record.setFieldValue("account",receivableAccounts.getValue(aptoInvoice.invoiceType));

	// translating ISO code into internal id
	var currencyMap = new CurrencyMap();
	nlapiLogExecution("DEBUG","Currency");
	record.setFieldValue("currency", currencyMap.getValue(aptoInvoice.currency));

	nlapiLogExecution("DEBUG","Client");
	record.setFieldValue("custbody_client", aptoInvoice.client); // client
	nlapiLogExecution("DEBUG","Salesperson");
	record.setFieldValue("salesrep",aptoInvoice.primaryBrokerId); // HRIS ID of employee
	nlapiLogExecution("DEBUG","DEAL Id");
	record.setFieldValue("custbody_deal",aptoInvoice.dealId); // ->> need translation from deal id 0000-nlapiLookupField('accountingperiod',aptoInvoice.accountingPeriodId,'enddate')0001

	var invoiceTerms = new InvoiceTerms();
	nlapiLogExecution("DEBUG","");
	record.setFieldValue("terms", invoiceTerms.getValue(aptoInvoice.terms));
	// record.setFieldValue("istaxable","1"); // -->> not sure if this should be used or not, leaving commented out

	// var postingPeriodDate = new Date(aptoInvoice.transactionDateInMillis); // APTO transaction date => NS posting period
	nlapiLogExecution("DEBUG","Posting period");
	record.setFieldValue("postingperiod",aptoInvoice.accountingPeriodId);

	var invoiceDate = nlapiDateToString(dateInMillis2date(aptoInvoice.invoiceDateInMillis), DATE_MASK);
	//var tranDate = nlapiDateToString(dateInMillis2date(aptoInvoice.transactionDateInMillis), DATE_MASK);
	//Deloitte JIRA 309: Change as per the new logic
	var enddate = new Date(nlapiLookupField('accountingperiod',aptoInvoice.accountingPeriodId,'enddate'));
	var newdate = calculateCorrectTransDate(dateInMillis2date(aptoInvoice.transactionDateInMillis),
									aptoInvoice.processingDateInMillis?dateInMillis2date(aptoInvoice.processingDateInMillis):null,
									dateInMillis2date(enddate.getTime()));
	nlapiLogExecution('DEBUG','NEW DATE',newdate);			
	var tranDate = nlapiDateToString(newdate, DATE_MASK);
	
	var dueDate = nlapiDateToString(dateInMillis2date(aptoInvoice.invoiceDateInMillis + invoiceTerms.getOffset(aptoInvoice.terms)), DATE_MASK);


	nlapiLogExecution("DEBUG", "Invoice Date " + invoiceDate);
	nlapiLogExecution("DEBUG", "Transaciton Date " + tranDate);
	nlapiLogExecution("DEBUG", "Due Date " + dueDate);

	record.setFieldValue("trandate", tranDate);
	record.setFieldValue("duedate", dueDate);
	record.setFieldValue("custbody_apto_inovoice_date", invoiceDate);

	if (aptoInvoice.hasOwnProperty("aptoTransactionDateInMillis") &&  aptoInvoice.aptoTransactionDateInMillis != null)
	{

		var aptoTransDate  = nlapiDateToString(dateInMillis2date(aptoInvoice.aptoTransactionDateInMillis), DATE_MASK);

		nlapiLogExecution("DEBUG", "Apto Origininal Transaction Date " + aptoTransDate);

		record.setFieldValue("custbody_ay_apto_trans_date", aptoTransDate);


	}
}
/**
 * Populate NS invoice line item(s)
 *
 * @param {APTOInvoice} aptoInvoice
 * @param {APTOInvoiceHeaderInformation} invoiceData - additional invoice information
 * @param {nlobjRecord} record  NS record of "invoice" type
 * @record invoice
 * @record item
 * @param {RESTLetResult} result
 */
function createNSInvoiceLineItems(aptoInvoice, invoiceData, record, result)
{
  var itemMaster = new ItemMaster();

  if (aptoInvoice.invoiceType == INVOICE_TYPE_UNBILLED_UNEARNED)
  {
	  nlapiLogExecution("DEBUG", "Unbilled/Unearned invoice - creating single line item");
	  var invoiceTotal = 0;

	  // need to disregard what is supplied by APTO in line items and create one with total amount and no taxes
	  for (var int = 0; int < aptoInvoice.lines.length; int++) {
		  invoiceTotal += aptoInvoice.lines[int].amount;
	  }

	  nlapiLogExecution("DEBUG","Invoice total: $" + invoiceTotal);

	  record.selectNewLineItem(GROUP_TYPE_ITEM);
	  record.setCurrentLineItemValue(GROUP_TYPE_ITEM,'item', itemMaster.getValue(ITEM_UNBILLED_UNEARNED_REVENUE));

	  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, 'amount', invoiceTotal);
	  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, 'quantity',1);
	  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, 'rate', invoiceTotal.toString());

	  // record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "custcol_assoc_sub", aptoInvoice.accountingClassification.subsidiary)
	  var department = ((aptoInvoice.hasOwnProperty("accountingClassification") &&
			  			 aptoInvoice.accountingClassification.hasOwnProperty("department")) ? aptoInvoice.accountingClassification.department
					  : invoiceData.accountingClassification.department);

	  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "department", department);

	  var location = ((aptoInvoice.hasOwnProperty("accountingClassification") &&
	  			 aptoInvoice.accountingClassification.hasOwnProperty("market")) ? aptoInvoice.accountingClassification.market
			  : invoiceData.accountingClassification.market);

	  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "location", location) // market/cost center

	  var category = ((aptoInvoice.hasOwnProperty("accountingClassification") &&
			  			 aptoInvoice.accountingClassification.hasOwnProperty("category")) ? aptoInvoice.accountingClassification.category
					  : invoiceData.accountingClassification.category);

	  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "class", category); // category

	  record.setCurrentLineItemValue(GROUP_TYPE_ITEM,  "description", "");

	  // NB! no taxes at this stage of the invoice
	  if (aptoInvoice.currency == CURRENCY_CAD ||
			  (invoiceData != null && invoiceData.currency == CURRENCY_CAD_CODE) ){ // for Canada, need to enforce no taxes
		  record.setCurrentLineItemValue(GROUP_TYPE_ITEM,  "taxcode", TAX_GROUP_CANADA_NO_TAXES); //  aptoInvoiceLine.taxGroup);
		}

		//DELOITTE FIX START -- 2129 -- US TAX CODE WHILE CREATING UNBILLED LINES
		else if(nlapiLookupField('subsidiary', record.getFieldValue('subsidiary'), 'country') == 'US'){
			nlapiLogExecution('DEBUG', 'Inside US sub while creating unbilled lines');
			record.setCurrentLineItemValue(GROUP_TYPE_ITEM,  "taxcode", -7); //setting tax code Non-Taxable for US sub
			nlapiLogExecution('DEBUG', 'After force setting tax code for US while creating unbilled lines');
		}
		//DELOITTE FIX END
		

	  record.commitLineItem(GROUP_TYPE_ITEM);

  }
  else
  {
	  for (var int = 0; int < aptoInvoice.lines.length; int++) {
		  /**
		   * @type APTOInvoiceLine
		   */
		  var aptoInvoiceLine = aptoInvoice.lines[int];
		  nlapiLogExecution("DEBUG", "Creating Line #" + int);
		  // creating line items

		  record.selectNewLineItem(GROUP_TYPE_ITEM);

		  nlapiLogExecution("DEBUG", "Item " + aptoInvoiceLine.item + " " + itemMaster.getValue(aptoInvoiceLine.item));
		  record.setCurrentLineItemValue(GROUP_TYPE_ITEM,'item', itemMaster.getValue(aptoInvoiceLine.item));


		  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, 'amount', aptoInvoiceLine.amount);
		  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, 'quantity',1);
		  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, 'rate', aptoInvoiceLine.amount.toString());


		  if (aptoInvoiceLine.accountingClassification.subsidiary == record.getFieldValue("subsidiary"))
	      {
			  nlapiLogExecution("DEBUG", "Same subsidiary as header","Market " + aptoInvoiceLine.accountingClassification.market);
			  // same subsidiary as header - use native fields
			  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "department",aptoInvoiceLine.accountingClassification.department); // department
			  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "location",aptoInvoiceLine.accountingClassification.market); // location market/cost center
			  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "class",aptoInvoiceLine.accountingClassification.category); // class/category

	      }
		  else
		  {
			  nlapiLogExecution("DEBUG", "Intercompany Allocation Required");

			 // native fields should be matching header
			  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "department",record.getFieldValue("department")); // department
			  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "location",record.getFieldValue("location")); // location market/cost center
			  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "class",record.getFieldValue("class")); // class/category

			  // AYPC-740 Bug fix
			  var subId = getSubsidairyMappingId(aptoInvoiceLine.accountingClassification.subsidiary);
			  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "custcol_allocation_sub", subId);
			  // custom columns to handle allocation JE creation

			  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "custcol_assoc_sub", aptoInvoiceLine.accountingClassification.subsidiary);
			  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "custcol_alloc_department",aptoInvoiceLine.accountingClassification.department); // department
			  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "custcol_alloc_cost_center",aptoInvoiceLine.accountingClassification.market); // location market/cost center
			  record.setCurrentLineItemValue(GROUP_TYPE_ITEM, "custcol_alloc_category",aptoInvoiceLine.accountingClassification.category); // class/category
		  }

		  record.setCurrentLineItemValue(GROUP_TYPE_ITEM,  "description", aptoInvoiceLine.memo);


		  // record.setCurrentLineItemValue(GROUP_TYPE_ITEM,  "tax1amt", 0); // aptoInvoiceLine.taxAmount
		nlapiLogExecution('DEBUG', "APTO invoice currency: ", aptoInvoice.currency);
		  nlapiLogExecution('DEBUG', "Invoice data in set lines: ", JSON.stringify(invoiceData));
		  nlapiLogExecution('DEBUG', "Sub country: ", nlapiLookupField('subsidiary', record.getFieldValue('subsidiary'), 'country'));
		  if (aptoInvoice.currency == CURRENCY_CAD ||
				  (invoiceData != null && invoiceData.currency == CURRENCY_CAD_CODE)) // for Canada, need to do some extra work with taxes
		  {
			  nlapiLogExecution("DEBUG", "CAD-only tax processing");

			  if (aptoInvoice.invoiceType == INVOICE_TYPE_BILLED_EARNED)
			  {
				  if (aptoInvoiceLine.taxGroup == null || aptoInvoiceLine.taxGroup == "")
				  {
					  nlapiLogExecution("DEBUG", "Taxes not specified - forcing 0 tax group");
					  record.setCurrentLineItemValue(GROUP_TYPE_ITEM,  "taxcode", TAX_GROUP_CANADA_NO_TAXES); //  aptoInvoiceLine.taxGroup);
				  }
				  else
			      {
					  // taxes group if any
					  // var taxCodes = new TaxCodes();
					  // nlapiLogExecution("DEBUG", "Setting up tax code " +  aptoInvoiceLine.taxGroup + " " + aptoInvoiceLine.taxGroup); // taxCodes.getValue(
					  record.setCurrentLineItemValue(GROUP_TYPE_ITEM,  "taxcode", aptoInvoiceLine.taxGroup); // taxCodes.getValue(aptoInvoiceLine.taxGroup)
			      }
			  }
			  else
			  {
				  nlapiLogExecution("DEBUG", "Candian not-printed invoice - overwriting tax group");
				  // no taxes yes
				  record.setCurrentLineItemValue(GROUP_TYPE_ITEM,  "taxcode", TAX_GROUP_CANADA_NO_TAXES);

			  }
		  }
		  else if (aptoInvoiceLine.taxGroup == TAX_GROUP_CANADA_NO_TAXES)
		  {
			  nlapiLogExecution("DEBUG", "Canadian Tax", "Canadian tax group (no tax) detected");
			  record.setCurrentLineItemValue(GROUP_TYPE_ITEM,  "taxcode", aptoInvoiceLine.taxGroup);
		  }
		  
		  //DELOITTE FIX START -- 1709 Canada tax issue
		  else if(invoiceData && invoiceData.currency == '2' && nlapiLookupField('subsidiary', record.getFieldValue('subsidiary'), 'country') == 'CA'){
			nlapiLogExecution('DEBUG', "Inside 3rd else if for tax code");
			record.setCurrentLineItemValue(GROUP_TYPE_ITEM,  "taxcode", TAX_GROUP_CANADA_NO_TAXES)
		  }
		  //DELOITTE FIX END
		  //DELOITTE FIX START -- 2129 -- US TAX CODE WHILE CREATING LINES
		  else if(nlapiLookupField('subsidiary', record.getFieldValue('subsidiary'), 'country') == 'US'){
			  nlapiLogExecution('DEBUG', 'Inside US sub while creating lines');
			  record.setCurrentLineItemValue(GROUP_TYPE_ITEM,  "taxcode", -7); //setting tax code Non-Taxable for US sub
			  nlapiLogExecution('DEBUG', 'After force setting tax code for US while creating lines');

		  }
		  //DELOITTE FIX END


		  record.commitLineItem(GROUP_TYPE_ITEM);
	  }
  }
}
/**
 * Convert data received from APTO into net NetSuite invoice
 *
 * @param {APTOInvoice} dateIn
 * @param {RESTLetResult} result
 */
function createNSInvoice(aptoInvoice, result)
{

	var record = createBaseNSInvoice(aptoInvoice)

	nlapiLogExecution("DEBUG", "Creating Invoice Header");
	createNSInvoiceHeader(aptoInvoice, record, result);
	nlapiLogExecution("DEBUG", "Creating Invoice Line Item(s)");
	createNSInvoiceLineItems(aptoInvoice, null, record, result);

	nlapiLogExecution("DEBUG", "passing invoice object to NetSuite");

	result.invoiceId = nlapiSubmitRecord(record);
	result.isSuccess = true;
}

/**
 * Start invoice record creation - base record
 *
 * @param {APTOInvoice} aptoInvoice
 * @returns {nlobjRecord}
 */
function createBaseNSInvoice(aptoInvoice)
{
	nlapiLogExecution("DEBUG", "Creating Invoice Record Type");

	var initvalues = {};

	initvalues["recordmode"] = 'dynamic';
	initvalues["entity"] = aptoInvoice.billTo; // bill to
if(aptoInvoice.accountingClassification&&aptoInvoice.accountingClassification.subsidiary)
  {
		initvalues["subsidiary"] = aptoInvoice.accountingClassification.subsidiary;
	}
	if (aptoInvoice.invoiceType == INVOICE_TYPE_UNBILLED_UNEARNED) // set custom form based on type of the invoice
	{
		initvalues["customform"] = INVOICE_CUSTOM_FORM_BILL_TO_INVOICE_ID;
	}
	else
	{
		initvalues["customform"] = INVOICE_CUSTOM_FORM_BILL_TO_INVOICE_ALLOCATIONS_ID;
	}

	var record = nlapiCreateRecord(RECORD_TYPE_INVOICE, initvalues);

	return record;

}

/**
 * Validate that data we got is correct
 * I am not sure how much validation should be here, since it's coming from integrated system
 *
 * @param {APTOInvoice} dataIn
 */
function validateInputData(dataIn,subid)
{
	nlapiLogExecution("DEBUG", "Validating APTO Invoice");

	var result = new RESTLetResult();

	var aptoInvoice = new APTOInvoice();

	if (dataIn.length != aptoInvoice.length)
	{
		result.errorCode = ERROR_CODE_INVALID_STRUCTURE;
		throw result;
	}

	if (dataIn.invoiceType == null ||  Number(dataIn.invoiceType) < 0 ||  Number(dataIn.invoiceType) > 3) // I know it's not 100% correct, but ...
	{
		result.errorCode = ERROR_CODE_INCORRECT_INVOICE_TYPE;
		throw result;
	}
	if (dataIn.lines.length == null || dataIn.lines.length == 0)
	{
		result.errorCode = ERROR_CODE_MISSING_INVOICE_LINES;
		throw result;
	}

	// okay ... now let's lookup fields we can
	nlapiLogExecution("DEBUG", "Looking up IDs");

	dataIn.primaryBrokerId = HRISID2EmployeeID(dataIn.primaryBrokerId);
	nlapiLogExecution("DEBUG", "Primary Broker", dataIn.primaryBrokerId);

	dataIn.dealId = DealID2ID(dataIn.dealId);
	nlapiLogExecution("DEBUG", "NS Deal ID", dataIn.dealId);

//	if (nlapiGetContext().getEnvironment() == 'SANDBOX')
//	{
//		nlapiLogExecution("DEBUG", "Executed in SandBox - looking for earliest open period");
//
	//AYPC-1008[Please comment line 405 and 394 together if a switch of accouting period logic is to be used]
	//var accountingPeriod = adjustmentAccountingPeriodSearch(dateInMillis2date(dataIn.transactionDateInMillis),subid);
	
//	}
//	else
	var accountingPeriod = accountingPeriodSearch(dateInMillis2date(dataIn.transactionDateInMillis),subid); // postingPeriodInMillis
	
	nlapiLogExecution("DEBUG", "Accounting Period", accountingPeriod.id +  " - " +  accountingPeriod.name);

	dataIn.accountingPeriodId = accountingPeriod.id;
	dataIn.aptoTransactionDateInMillis = dataIn.transactionDateInMillis;
	//AYPC-1008[Please comment line 405 and 394 together if a switch of accouting period logic is to be used]
	//dataIn.transactionDateInMillis =  nlapiStringToDate(accountingPeriod.lastSunday, DATE_MASK).getTime();
}

/**
 * Create APTO invoice in NetSuite
 *
 * @param {APTOInvoice} aptoInvoice
 */
function createAPTOInvoice(aptoInvoice)
{
	var result = new RESTLetResult();
	var subid = nlapiLookupField('customer', aptoInvoice.billTo, "subsidiary");
	if(aptoInvoice.accountingClassification&&aptoInvoice.accountingClassification.subsidiary){
		subid = aptoInvoice.accountingClassification.subsidiary;
	}
	validateInputData(aptoInvoice,subid);
	

	nlapiLogExecution("DEBUG", "APTO Invoice:", JSON.stringify(aptoInvoice));

	createNSInvoice(aptoInvoice, result);

	return result;
}

/**
 * Recreate invoice based on adjustments defined in aptoInvoice
 *
 * @param {string} invoiceId NetSuite invoice id to recreate
 * @param {APTOInvoice} aptoInvoice changes to make
 * @param {int} adjDate adjustment date (in case aptoInvoice does not have it)
 *
 * @returns {string} id of the newly created invoice
 */
function recreateInvoice(invoiceId, aptoInvoice, adjDate)
{
	nlapiLogExecution("DEBUG","Start -> Recreating invoice ");
	// nlapiLogExecution("DEBUG","" + invoiceId + " " + JSON.stringify(aptoInvoice));
	// create copy of the invoice for adjustment purposes
	/** @type {nlobjRecord} **/

	try
	{
		if (adjDate != null && ! aptoInvoice.hasOwnProperty("transactionDateInMillis"))
		{
			aptoInvoice.transactionDateInMillis = adjDate;
		}
		// passing invoice to be used as init parameter
		/** @type nlobjRecord */
		var newInvoice = copyInvoice(invoiceId, aptoInvoice);

		// need to change transaction id in old invoice
		/** @type APTOInvoiceHeaderInformation **/
		var invoiceData = markInvoiceAdjustedAndGetData(invoiceId);

		

				// invoice - offset with credit memo and create new one in the earliest posting period (using original posting period of the invoice)
		var creditMemoId = createCreditMemo4Invoice(invoiceId, CM_ADJUSTMENT,dateInMillis2date(aptoInvoice.transactionDateInMillis), 
				dateInMillis2date(aptoInvoice.transactionDateInMillis), aptoInvoice.processingDateInMillis?dateInMillis2date(aptoInvoice.processingDateInMillis):null);


		// we need to load created credit memo
		/** @type nlobjRecord */
		var creditMemo =  nlapiLoadRecord(RECORD_TYPE_CREDIT_MEMO, creditMemoId);


		nlapiLogExecution("DEBUG","Saved Invoice Data", JSON.stringify(invoiceData));

		// newInvoice.setFieldValue("trandate", invoiceData.invoiceDate);
		invoiceData.saveToInvoice(newInvoice);

		nlapiLogExecution("DEBUG","Invoice Due Date", newInvoice.getFieldValue("duedate"));

		// shortcut - use posting period from credit memo
		nsInvoiceSetAdjustments(newInvoice, aptoInvoice, invoiceData);

		nlapiLogExecution("DEBUG","Posting Period and Transaction Date", creditMemo.getFieldValue("postingperiod") + " " + creditMemo.getFieldValue("trandate"));

		var dueDate = newInvoice.getFieldValue("duedate"); // preserving value
		nlapiLogExecution("DEBUG","Invoice Due Date [2]", newInvoice.getFieldValue("duedate"));


		newInvoice.setFieldValue("postingperiod", creditMemo.getFieldValue("postingperiod"));
		newInvoice.setFieldValue("trandate", creditMemo.getFieldValue("trandate"));

		newInvoice.setFieldValue("duedate", dueDate);
		
		nlapiLogExecution("DEBUG","Saving new invoice record", JSON.stringify(newInvoice));
		// var newInvoiceId;

		// nlapiLogExecution("DEBUG","******** New Invoice ************", newInvoice.getFieldValue("department") + " " + newInvoice.getFieldValue("location") + " " + newInvoice.getFieldValue("class"));
		var newInvoiceId = nlapiSubmitRecord(newInvoice);
		//DELOITTE FIX START - Fix for Tax amount not getting calculated at header even when line level tax rate is present
		var newInvoiceLoaded = nlapiLoadRecord('invoice', newInvoiceId, {recordmode: 'dynamic'});
		nlapiSubmitRecord(newInvoiceLoaded);
		//DELOITTE FIX END

	}
	catch (e)
	{
		nlapiLogExecution("DEBUG","Error saving invoice - rolling back",e.message);
		if (creditMemoId != null){
			//DELOITTE FIX START -- Unapplying credit memo from the old invoice -- 1219 rollback issue
			var cm = nlapiLoadRecord('creditmemo', creditMemoId);
			var lineCount = cm.getLineItemCount('apply');

			for(var i = 1; i <= lineCount; i++){
				var applied = cm.getLineItemValue('apply', 'apply', i);

				//If line is applied, unapply it from the invoice
				if(applied == 'T'){
					cm.setLineItemValue('apply', 'apply', i, 'F');
				}
			}	
			nlapiLogExecution("DEBUG", "Saving credit memo after unapply", creditMemoId);
			nlapiSubmitRecord(cm);
			//DELOITTE FIX END
			voidTransaction(RECORD_TYPE_CREDIT_MEMO, creditMemoId);
}

		rollbackInvoiceAdjustment(invoiceId);
		throw e;

	}
	nlapiLogExecution("DEBUG","New invoice id " +  newInvoiceId);

	// if credit memo has balance on it, it means that old invoice was partially paid.
	// I am going to apply this balance to new invoice, so subsequent payment application
	// from APTO worked.

	if (creditMemo.getFieldValue("unapplied") > 0)
	{
		nlapiLogExecution("DEBUG", "Credit memo has a balance on it - let's apply it to new invoice");
		applyCMBalanceToInvoice(creditMemo.getId(), newInvoiceId);

	}

	nlapiLogExecution("DEBUG","Done");
	return newInvoiceId;
}
/**
 * Create copy of the existing invoice
 *
 * @param {string} invoiceId - existing NS invoice internal id
 * @param {APTOInvoice} aptoInvoice - optional billTo NS internal id
 *
 * @returns {nlobjRecord} new invoice record
 */
function copyInvoice(invoiceId, aptoInvoice)
{
	nlapiLogExecution("DEBUG", "Creating copy of existing invoice # " + invoiceId);

	var initvalues = {};
	var invoice;

	initvalues["recordmode"] = 'dynamic';

	nlapiLogExecution('DEBUG', "Apto Invoice JSON before: ", JSON.stringify(aptoInvoice));

	if (aptoInvoice == null || !(aptoInvoice.hasOwnProperty("billTo")) || !(aptoInvoice.billTo != null))
	{
		nlapiLogExecution('DEBUG', 'Adding Bill To to the input...');
		var billTo = nlapiLookupField('invoice',invoiceId,'entity');
		aptoInvoice.billTo = billTo;
	}
	nlapiLogExecution('DEBUG', "Apto Invoice JSON after: ", JSON.stringify(aptoInvoice));
		nlapiLogExecution("DEBUG", "Creating invoice from scratch");
		/** type {nlobjRecord} **/
		invoice = createBaseNSInvoice(aptoInvoice);
      //Deloitte start : Fix for https://avisonyoung.zendesk.com/agent/tickets/676
		//This new invoice will always have the same subsidiary as the old invoice  
		nlapiLogExecution('AUDIT','ZZ Apto INVOICE',JSON.stringify(aptoInvoice));
		if(!(aptoInvoice.accountingClassification && aptoInvoice.accountingClassification.subsidiary)){
			var billtosub = invoice.getFieldValue('subsidiary');
			var oldinvsub = nlapiLookupField('invoice',invoiceId,'subsidiary');
			nlapiLogExecution('AUDIT','Original Invoice Sub '+ oldinvsub,'Bill to Sub ' + billtosub);
			if(oldinvsub != billtosub){//keeping the subsidiary same for the original and the new invoice
				invoice.setFieldValue('subsidiary',oldinvsub);
			}
		}
		//Deloitte end
		nlapiLogExecution("DEBUG", "Coping values from old invoice");
		var linesPresent = (aptoInvoice.hasOwnProperty("lines") && aptoInvoice.lines != null && aptoInvoice.lines.length > 0);

		copyBaseInvoiceParameters(invoice, invoiceId, linesPresent);

	/*}
	else
	{
		nlapiLogExecution("DEBUG", "Creating invoice via copy");
		invoice =  nlapiCopyRecord(RECORD_TYPE_INVOICE, invoiceId, initvalues);
		invoice.setFieldValue("custbody_isssrunning","F"); // Per Peter, setting to false AYPC-918
	}*/

	nlapiLogExecution("DEBUG", "Bill To", invoice.getFieldValue("entity"));

	nlapiLogExecution("DEBUG", "Done");

	return invoice;
}

/**
 * Copy things we need to carry over from old invoice
 *
 * @param {nlobjRecord}  record
 * @param {string} invoiceId
 * @param {Boolean} linesPresent
 */
function copyBaseInvoiceParameters(record, invoiceId, linesPresent)
{
	var oldInvoice = nlapiLoadRecord(RECORD_TYPE_INVOICE, invoiceId);

	record.setFieldValue("externalid", oldInvoice.getFieldValue("custbody_apto_invoice"));
	record.setFieldValue("tranid", oldInvoice.getFieldValue("custbody_apto_invoice"));
	record.setFieldValue("custbody_apto_invoice", oldInvoice.getFieldValue("custbody_apto_invoice"));
	nlapiLogExecution('AUDIT','OLD vs NEW Subsi',oldInvoice.getFieldValue("subsidiary")  +"  " +  record.getFieldValue("subsidiary"));


	record.setFieldValue("account", oldInvoice.getFieldValue("account"));
	nlapiLogExecution('AUDIT','OLD vs NEW Subsi',oldInvoice.getFieldValue("subsidiary")  +" -- " +  record.getFieldValue("subsidiary"));
	// subsidiary was not changed - I can carry over classifications
	if (oldInvoice.getFieldValue("subsidiary") == record.getFieldValue("subsidiary"))
	{
		record.setFieldValue("department", oldInvoice.getFieldValue("department"));
		record.setFieldValue("location", oldInvoice.getFieldValue("location")) // market/cost center
		record.setFieldValue("class", oldInvoice.getFieldValue("class")); // category
	}

	record.setFieldValue("currency", oldInvoice.getFieldValue("currency"));

	record.setFieldValue("custbody_client", oldInvoice.getFieldValue("custbody_client")); // client
	record.setFieldValue("salesrep",oldInvoice.getFieldValue("salesrep")); // HRIS ID of employee

	record.setFieldValue("custbody_deal", oldInvoice.getFieldValue("custbody_deal")); // ->> need translation from deal id 0000-0001

	record.setFieldValue("terms", oldInvoice.getFieldValue("terms"));
	// record.setFieldValue("postingperiod", oldInvoice.getFieldValue("postingperiod"));

	// record.setFieldValue("trandate", oldInvoice.getFieldValue("trandate"));
	record.setFieldValue("duedate", oldInvoice.getFieldValue("duedate"));
	record.setFieldValue("custbody_apto_inovoice_date", oldInvoice.getFieldValue("custbody_apto_inovoice_date"));

	if (! linesPresent)
	{
		nlapiLogExecution("DEBUG", "Coping invoice lines");
		copyInvoiceLines(oldInvoice, record);

	}

}

/**
 * Copy lines from invoice to invoice
 *
 * @param {nlobjRecord} oldInvoice
 * @param {nlobjRecord} newInvoice
 */
function copyInvoiceLines(oldInvoice, newInvoice)
{
	var lineCount = oldInvoice.getLineItemCount(GROUP_TYPE_ITEM);
	var lineFields = ["item",
			"amount",
			"quantity",
			"rate",
			"department",
			"location",
			"class",
			"custcol_allocation_sub",
			"custcol_assoc_sub",
			"custcol_alloc_department",
			"custcol_alloc_cost_center",
			"custcol_alloc_category",
			"description",
			"taxcode"];

	nlapiLogExecution("DEBUG", "Copying " + lineCount +  " existing lines");
	for (var int = 1; int <= lineCount; int++) {

		newInvoice.selectNewLineItem(GROUP_TYPE_ITEM);
		oldInvoice.selectLineItem(GROUP_TYPE_ITEM, int);

		for (var i = 0; i < lineFields.length; i++) {
			var fieldValue = oldInvoice.getCurrentLineItemValue(GROUP_TYPE_ITEM,  lineFields[i]);
			
		

			//DELOITTE FIX START - TAX CODE ISSUE - FORCE SET TAX CODE for US SUBS to 'NON-TAXABLE'
			if (fieldValue != null && lineFields[i] != 'taxcode'){
				newInvoice.setCurrentLineItemValue(GROUP_TYPE_ITEM,  lineFields[i], fieldValue);
			}
			else if(lineFields[i] == 'taxcode'){

				nlapiLogExecution("DEBUG", "Inside taxcode field copy");
				var subCountry = nlapiLookupField('subsidiary', newInvoice.getFieldValue('subsidiary'), 'country');
				if(subCountry == 'US'){

					nlapiLogExecution("DEBUG", "Inside US country Sub");
					newInvoice.setCurrentLineItemValue(GROUP_TYPE_ITEM, lineFields[i], -7);
					nlapiLogExecution("DEBUG", "After force setting tax code for US subs: ", newInvoice.getCurrentLineItemValue(GROUP_TYPE_ITEM, lineFields[i]));
				}
				else{
					newInvoice.setCurrentLineItemValue(GROUP_TYPE_ITEM,  lineFields[i], fieldValue);
				}

			}
			//DELOITTE FIX END
				
		}


		newInvoice.commitLineItem(GROUP_TYPE_ITEM);
	}
}
/**
 * Incremental update of the invoice based on fields passed over
 *
 *
 * @param {nlobjRecord} nsInvoice reference to invoice record
 * @param {APTOInvoice} aptoInvoice adjustments to invoice
 * @param {APTOInvoiceHeaderInformation} invoiceData additional header information we might need (but not part of the adjustment)
 */
function nsInvoiceSetAdjustments(nsInvoice, aptoInvoice, invoiceData)
{
	var result = new RESTLetResult();

	nlapiLogExecution("DEBUG", "Field-level adjustments (invoice)");
	nlapiLogExecution('DEBUG', "Apto Invoice data during creation of new invoice: ", JSON.stringify(aptoInvoice));
	nsInvoice.setFieldValue("externalid", aptoInvoice.invoiceNo);
	nsInvoice.setFieldValue("tranid", aptoInvoice.invoiceNo);

	//DELOITTE FIX START -- 1709 Canada tax issue
	var tempBillTo = nsInvoice.getFieldValue('entity');
	//DELOITTE FIX END

	nlapiLogExecution('DEBUG', "Current Bill to before sub change: ", tempBillTo);
	if (aptoInvoice.hasOwnProperty("accountingClassification"))
	{
		nlapiLogExecution("DEBUG", "Setting segmentation");
		//DELOITTE FIX START -- Uncommenting the subsidiary mapping on invoice adjustment for ticket 1219
		if (aptoInvoice.accountingClassification.hasOwnProperty("subsidiary"))
		{
			nlapiLogExecution('DEBUG', "Inside subsidiary set: ");
			nsInvoice.setFieldValue("subsidiary", aptoInvoice.accountingClassification.subsidiary);
		}
		//DELOITTE FIX END
		nlapiLogExecution('DEBUG', "Sub after sub change: ", nsInvoice.getFieldValue('subsidiary'));
		if (aptoInvoice.accountingClassification.hasOwnProperty("department"))
		{
			nsInvoice.setFieldValue("department", aptoInvoice.accountingClassification.department);
		}
		nlapiLogExecution('DEBUG', "Department after sub change: ", nsInvoice.getFieldValue('department'));
		if (aptoInvoice.accountingClassification.hasOwnProperty("market"))
		{
			nsInvoice.setFieldValue("location", aptoInvoice.accountingClassification.market);
		}
nlapiLogExecution('DEBUG', "Location after sub change: ", nsInvoice.getFieldValue('location'));
		if (aptoInvoice.accountingClassification.hasOwnProperty("category"))
		{
			nsInvoice.setFieldValue("class", aptoInvoice.accountingClassification.category);
		}
		nlapiLogExecution('DEBUG', "Bill to after sub change: ", nsInvoice.getFieldValue('entity'));
		nsInvoice.setFieldValue('entity', tempBillTo, false);
		nlapiLogExecution('DEBUG', "Sub after bill to reset", nsInvoice.getFieldValue('subsidiary'));
		nlapiLogExecution("DEBUG","******** Header ************", nsInvoice.getFieldValue("subsidiary") + " " +  nsInvoice.getFieldValue("department") + " " + nsInvoice.getFieldValue("location") + " " + nsInvoice.getFieldValue("class"));

	}

	for (var fieldName in  aptoInvoice)
	{
		nlapiLogExecution("DEBUG", "Adjusting " + fieldName);

		switch (fieldName) {
			case 'lines':
				nlapiLogExecution("DEBUG", "Adjusting invoice line items");

				deleteNSInvoiceLines(nsInvoice);
				createNSInvoiceLineItems(aptoInvoice, invoiceData, nsInvoice, result);
				break;
			// case 'billTo':
				// nlapiLogExecution("DEBUG", "New Value " + aptoInvoice[fieldName]);
				// nsInvoice.setFieldValue('entity', aptoInvoice[fieldName]);
				// break;
			case 'primaryBrokerId':
				nlapiLogExecution("DEBUG", "New Value " + aptoInvoice[fieldName]);
				nsInvoice.setFieldValue('salesrep', aptoInvoice[fieldName]);
				break;
/*			case 'accountingClassification':
				nlapiLogExecution("DEBUG", "Setting segmentation");
				if (aptoInvoice.accountingClassification.hasOwnProperty("subsidiary"))
				{
					nsInvoice.setFieldValue("subsidiary", aptoInvoice.accountingClassification.subsidiary);
				}
				if (aptoInvoice.accountingClassification.hasOwnProperty("department"))
				{
					nsInvoice.setFieldValue("department", aptoInvoice.accountingClassification.department);
				}
				if (aptoInvoice.accountingClassification.hasOwnProperty("market"))
				{
					nsInvoice.setFieldValue("location", aptoInvoice.accountingClassification.market);
				}
				if (aptoInvoice.accountingClassification.hasOwnProperty("category"))
				{
					nsInvoice.setFieldValue("class", aptoInvoice.accountingClassification.category);
				}


				break;*/
				//TODO:to be asked
			case 'transactionDateInMillis':
				var subid = nsInvoice.getFieldValue("subsidiary");
				var accountingPeriod = accountingPeriodSearch(dateInMillis2date(aptoInvoice[fieldName]),subid);
				var fieldValue = accountingPeriod.id;
				nsInvoice.setFieldValue("postingperiod", fieldValue);
				nlapiLogExecution("DEBUG", "New Value " + fieldValue + " " + accountingPeriod.name);
				break;
			case 'invoiceDateInMillis':
				var dueDateOffset = 0;

				if (aptoInvoice.hasOwnProperty("terms"))
				{
					var invoiceTerms = new InvoiceTerms();
					dueDateOffset = invoiceTerms.getOffset(aptoInvoice.terms);
				}
				else
				{
					dueDateOffset = nlapiStringToDate(invoiceData.dueDate, DATE_MASK).getTime() -
								    nlapiStringToDate(invoiceData.invoiceDate, DATE_MASK).getTime();
				}
				var invoiceDate = nlapiDateToString(dateInMillis2date(aptoInvoice.invoiceDateInMillis), DATE_MASK);
				var dueDate = nlapiDateToString(dateInMillis2date(aptoInvoice.invoiceDateInMillis + dueDateOffset), DATE_MASK);

				nlapiLogExecution("DEBUG", "Invoice Date " + invoiceDate);
				nlapiLogExecution("DEBUG", "Due Date " + dueDate);

				nsInvoice.setFieldValue("duedate", dueDate);
				nsInvoice.setFieldValue("custbody_apto_inovoice_date", invoiceDate);
				break;
			default:
				nlapiLogExecution("DEBUG", "This filed is handled elsewhere");


		}
	}


	nlapiLogExecution("DEBUG", "Done");
}

/**
 * Adjust invoice number and external reference
 * Optimization - to avoid extra reads from NS, get invoice date
 *
 * @param invoiceId
 * @returns {APTOInvoiceHeaderInformation}
 */
function markInvoiceAdjustedAndGetData(invoiceId)
{
	var invoiceData = new APTOInvoiceHeaderInformation();

	nlapiLogExecution("DEBUG", "Loading invoice ",invoiceId);

	// This call does not work for invoices in closed periods
	// var invoice = nlapiLoadRecord(RECORD_TYPE_INVOICE, invoiceId);
	// var externalId = invoice.getFieldValue("custbody_apto_invoice") + ".ADJ." + new Date().YYYYMMDDHHMMSS();

	var aptoInvoiceId = nlapiLookupField(RECORD_TYPE_INVOICE, invoiceId, "custbody_apto_invoice");

	var externalId = aptoInvoiceId + ".ADJ." + new Date().YYYYMMDDHHMMSS();
	nlapiLogExecution("DEBUG", "External ID ",externalId);

	// invoiceData.readFromInvoice(invoice);
	invoiceData.readFromInvoice(invoiceId);

	var invoice = nlapiLoadRecord(RECORD_TYPE_INVOICE, invoiceId);
	invoice.setFieldValue("externalid", externalId);
	invoice.setFieldValue("tranid", externalId);

	renameAllocationJE(invoice);

	nlapiSubmitRecord(invoice);

	// nlapiSubmitField(RECORD_TYPE_INVOICE, invoiceId, ["externalid", "tranid"], [externalId,externalId]);

	nlapiLogExecution("DEBUG", "Invoice " + invoiceId, " Renamed into " + externalId);

	return invoiceData;
}

/**
 * Go thru invoice line items and if existing allocation line is item - rename to match tranid
 *
 * @param {nlobjRecord} invoice
 *
 */
function renameAllocationJE(invoice)
{
	var prefix = invoice.getFieldValue("tranid");

	var lineCount = invoice.getLineItemCount(GROUP_TYPE_ITEM);



	nlapiLogExecution("DEBUG",  "Looking for ICJE(s)", prefix + " " + lineCount + " lines");

	for (var int = 1; int <= lineCount; int++) {



		var icjeID = invoice.getLineItemValue(GROUP_TYPE_ITEM,  "custcol_assoc_ic", int);

		if (icjeID != null && icjeID != "")
		{
			var oldicjeTranId = nlapiLookupField(RECORD_TYPE_JOURNAL_ENTRY, icjeID, 'tranid');


			if (oldicjeTranId != null)
			{
				var icjeTranId = prefix + ".ICJE" + int;   // nlapiLookupField(RECORD_TYPE_ADV_INETRCOMPANY_JOURNAL_ENTRY, icjeID, 'tranid');

				nlapiLogExecution("DEBUG", "Renaming ICJE " + icjeID, "From " + oldicjeTranId + " to " + icjeTranId);
				try
				{
					nlapiSubmitField(RECORD_TYPE_ADV_INETRCOMPANY_JOURNAL_ENTRY, icjeID, ["externalid", "tranid"], [icjeTranId, icjeTranId]);
				}
				catch (e)
				{
					nlapiLogExecution("DEBUG", "Error saving as " + RECORD_TYPE_ADV_INETRCOMPANY_JOURNAL_ENTRY, e.message);

					try
					{
						nlapiSubmitField(RECORD_TYPE_INETRCOMPANY_JOURNAL_ENTRY, icjeID, ["externalid", "tranid"], [icjeTranId, icjeTranId]);
					}
					catch (e)
					{
						nlapiLogExecution("DEBUG", "Error saving as " + RECORD_TYPE_INETRCOMPANY_JOURNAL_ENTRY, e.message);
					}
				}

			}

		}

	}


}
/**
 * Roll back invoice number change
 *
 * @param {string} invoiceId
 */
function rollbackInvoiceAdjustment(invoiceId)
{

	// var invoice = nlapiLoadRecord(RECORD_TYPE_INVOICE, invoiceId);
	// var oldInvoiceNumber = invoice.getFieldValue("custbody_apto_invoice");
	// invoice.setFieldValue("externalid", oldInvoiceNumber);
	// invoice.setFieldValue("tranid", oldInvoiceNumber);

	// nlapiSubmitRecord(invoice);
	var oldInvoiceNumber = nlapiLookupField(RECORD_TYPE_INVOICE, invoiceId, "custbody_apto_invoice");

	nlapiLogExecution("DEBUG", "Restoring Invoice " + invoiceId, "Tran Id" + oldInvoiceNumber);

	nlapiSubmitField(RECORD_TYPE_INVOICE, invoiceId, ["externalid", "tranid"], [oldInvoiceNumber, oldInvoiceNumber]);



}
/**
 * Delete lines from invoice we are adjusting
 *
 * @param {nlobjRecord} nsInvoice
 */
function deleteNSInvoiceLines(nsInvoice)
{
	var lineCount = nsInvoice.getLineItemCount(GROUP_TYPE_ITEM);

	nlapiLogExecution("DEBUG", "Deleting " + lineCount +  " existing lines");
	for (var int = 1; int <= lineCount; int++) {
		nsInvoice.removeLineItem(GROUP_TYPE_ITEM, 1);
	}
}

/**
 * Populate data structure from existing record in the system
 *
 * @param {APTOInvoice} aptoInvoice
 * @param {nlobjRecord} invoiceRecord
 */
function populateFromNSInvoice(aptoInvoice, invoiceRecord)
{
	aptoInvoice.transactionId = invoiceRecord.getFieldValue("tranid");
	aptoInvoice.dealId = invoiceRecord.getFieldValue("custbody_deal");

	var currencyMap = new CurrencyMap();
	aptoInvoice.currency = currencyMap.getKey(invoiceRecord.getFieldValue("currency"));

	aptoInvoice.billTo = invoiceRecord.getFieldValue("entity");

	aptoInvoice.client = invoiceRecord.getFieldValue("custbody_client");
	aptoInvoice.primaryBrokerId = invoiceRecord.getFieldValue("salesrep");

	aptoInvoice.invoiceDateInMillis = nlapiStringToDate(invoiceRecord.getFieldValue("trandate"), DATE_MASK).getTime();

	//aptoInvoice.transactionDateInMillis = invoiceRecord.getFieldValue("");
	aptoInvoice.accountingPeriodId = invoiceRecord.getFieldValue("postingperiod");

	aptoInvoice.accountingClassification = new AccountingClassification();

	aptoInvoice.accountingClassification.populateFromNSRecord(invoiceRecord);
}

///**
// * Write off invoice voided in APTO
// *
// * @param {string} transactionRecordId - NetSuite transaction id
// */
//function writeOffInvoice(transactionRecordId)
//{
//	// lookup invoice
//	nlapiLogExecution("DEBUG", "Writing off invoice", "Start");
//
//	// var nsInvoice = nlapiLoadRecord(RECORD_TYPE_INVOICE, transactionRecordId);
//	/** @type {nlobjRecord}  **/
//	var payment = nlapiTransformRecord(RECORD_TYPE_INVOICE, transactionRecordId, RECORD_TYPE_CUST_PAYMENT);
//	payment.setFieldValue("custbody_isssrunning","F"); // Per Peter, setting to false AYPC-918
//
//	payment.setFieldValue("account", ACCOUNT_ZBA_BAD_DEBT_WRITE_OFF_EXPENSE);
//
//	// need to setup fields not set by record transformation
//	var invoice = nlapiLoadRecord(RECORD_TYPE_INVOICE, transactionRecordId);
//
//	payment.setFieldValue("department",invoice.getFieldValue("department"));
//	payment.setFieldValue("location", invoice.getFieldValue("location")) // market/cost center
//	payment.setFieldValue("class", invoice.getFieldValue("class"));  // category
//
//	payment.setFieldValue("memo", "APTO invoice " + invoice.getFieldValue("custbody_apto_invoice") + " write-off");
//
//	payment.setFieldValue("custbody_client",invoice.getFieldValue("custbody_client"));
//	payment.setFieldValue("custbody_deal", invoice.getFieldValue("custbody_deal"));
//
//	var paymentId = nlapiSubmitRecord(payment);
//
//	nlapiLogExecution("DEBUG", "Wring off invoice", "Payment ID " + paymentId);
//	nlapiLogExecution("DEBUG", "Wring off invoice", "Done");
//}
