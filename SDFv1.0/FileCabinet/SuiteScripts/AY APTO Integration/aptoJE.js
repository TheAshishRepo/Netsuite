/**
 * Libriary of funcitions dealing with NetSuite journal entries
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       11 Jan 2016     georgem          NetSuite JE creation. This version won't cover intercompany JE
 *
 * @module aptoJE
 * @requires aptoSalesTransactionDefs
 * @requires aptoSalesTransactionLib
 */
//DELOITTE BUILD-COMMIT:SPRINT 6 PROD deployment-1 
var COL_ACCOUNT = 0;
var COL_CURRENCY = 1;
var COL_DEPARTMENT = 2;
var COL_LOCATION = 3;
var COL_CLASS = 4;
var COL_CREDIT = 5;
var COL_DEBIT = 6;
// var COL_SUBSIDIARY = 7;
var COL_FX_AMOUNT = 7;
var COL_SIGNED_AMOUNT = 8;

/**
 * @summary Create journal entries for specified sales transaction
 * @description Candian billed transaction have to include journal entry that allocates portion of the tax liability to
 * third party (if third party exists on this transaciton) this fucntion looks at the data coming from Apto and creates
 * journal entry as required
 *
 * @param {APTOSalesTransaction} aptoSalesTransaction
 */
function salesTaxLiabilityJE(aptoSalesTransaction)
{
	var je = new NSJournalEntry();

	nlapiLogExecution("DEBUG", "Creating JE for sales tax liability");

	je.populateFromSalesTransaction(aptoSalesTransaction);

	nlapiLogExecution("DEBUG", JSON.stringify(je));
	nlapiLogExecution("DEBUG", "APTO sales transaction" , JSON.stringify(aptoSalesTransaction));

	createNetSuiteJE(je);

}

/**
 * Create journal entry using our structure
 *
 * @param {NSJournalEntry} je
 */
function createNetSuiteJE(je)
{

	nlapiLogExecution("DEBUG", "Creating NS journal entry header");
	// nlapiLogExecution("DEBUG", JSON.stringify(je));
	nlapiLogExecution("DEBUG",'vvvvv' ,JSON.stringify(je));
	
	//var line = je.lines[int];
	var dealId = je.lines[0].deal_id;

	nlapiLogExecution("DEBUG", "Deal Id .............", dealId);
	
	var dealName = nlapiLookupField('customrecord_deal',dealId,'custrecord_deal_name');
	nlapiLogExecution("DEBUG", "dealName............", dealName);
	
	
	var jeRec = nlapiCreateRecord(RECORD_TYPE_JOURNAL_ENTRY); // , {recordmode: 'dynamic'}

	// setup accounting attributes
	jeRec.setFieldValue("subsidiary", je.subsidiary);
	jeRec.setFieldValue("approved", 'T');

	jeRec.setFieldValue("postingperiod",je.postingPeriod);

	jeRec.setFieldValue("trandate", je.tranDate);
	jeRec.setFieldValue("currency", je.currency);

	if (je.hasOwnProperty("aptoInvoice") && je.aptoInvoice != null && je.aptoInvoice != "")
	{
		nlapiLogExecution("DEBUG",'if.......' ,'if........');
		jeRec.setFieldValue("custbody_apto_invoice_test",je.aptoInvoice);
		jeRec.setFieldValue("custbody_apto_invoice",je.aptoInvoice);
		jeRec.setFieldValue("tranid",je.aptoInvoice);
		jeRec.setFieldValue("externalid","JE" + je.aptoInvoice);
		
		//657
		jeRec.setFieldValue("custbody_deal",dealId);
		jeRec.setFieldValue("custbodyinv_deal_name",dealName);
		
	}
	else if (je.hasOwnProperty("aptoPaymentNumber") && je.aptoPaymentNumber != null && je.aptoPaymentNumber != "")
	{
		nlapiLogExecution("DEBUG",'aptoInvoice.......' ,je.invoiceNumber);
		jeRec.setFieldValue("custbody_apto_payment_number",je.aptoPaymentNumber);
		jeRec.setFieldValue("tranid",je.aptoPaymentNumber);
		jeRec.setFieldValue("externalid","JE" + je.aptoPaymentNumber);
		
		//657
		jeRec.setFieldValue("custbody_deal",dealId);
		jeRec.setFieldValue("custbodyinv_deal_name",dealName);
		jeRec.setFieldValue("custbody_apto_invoice_test",je.invoiceNumber);
		
	}
	else
		nlapiLogExecution("DEBUG", "JE is not associated with APTO invoice or payment");



	// let's setup line item
	nlapiLogExecution("DEBUG", "Creating journal entry line items");

	createJELineItems(jeRec, je);


	// nlapiLogExecution("DEBUG", "JE: " + JSON.stringify(jeRec));
	nlapiLogExecution("DEBUG", "Submitting record to NS");
	try
	{
		jeRec.setFieldValue('approved', 'T');
		var id = nlapiSubmitRecord(jeRec);
		nlapiLogExecution("DEBUG", "record id " + id);

		return id;
	}
	catch (e)
	{
		nlapiLogExecution("DEBUG", "Error creating JE " + e.getCode() + " " + e.getDetails());
		throw e;
	}

}

/**
 * Create line items for NetSuite JE (APTO Sales transaction - 3rd party taxes)
 *
 * @param {nlobjRecord} jeRec NetSuite record
 * @param {NSJournalEntry} je journal entry information
 */
function createJELineItems(jeRec, je)
{
	for (var int = 0; int < je.lines.length; int++) {
		nlapiLogExecution("DEBUG", "Line item " + int);

		/**
		 * @type {TaxParticipant}
		 */
		var line = je.lines[int];
		
		
		//Deloitte fix 657
		
		var dealName = nlapiLookupField('customrecord_deal',line.deal_id,'custrecord_deal_name');
		nlapiLogExecution("DEBUG", "dealName............", dealName);
		nlapiLogExecution("DEBUG", "je.aptoInvoice............", je.aptoInvoice);
		

		jeRec.selectNewLineItem(GROUP_TYPE_LINE);

		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_client", line.clientId); // client
		//jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_deal_line_test",line.deal_id);
		
		// Test 
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_je_deal",line.deal_id);
		
		// Fix 657
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_deal_name",dealName);
		if(je.aptoInvoice != null && je.aptoInvoice != "")
		{
			//jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_apto_invoice_line_test",je.aptoInvoice);
			jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_apto_invoice",je.aptoInvoice);
		}
		
		if(je.invoiceNumber != null && je.invoiceNumber != "")
		{
			//jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_apto_invoice_line_test",je.invoiceNumber);
			jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_apto_invoice",je.invoiceNumber);
		}

		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_employee",line.employeeId);


		if (line.hasOwnProperty("aptoVendorId") && line.aptoVendorId != null && line.aptoVendorId != "") // added new custom field to journal entry line item
		{
			nlapiLogExecution("DEBUG", "APTO Vendor specified");
			jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_apto_vendor_id", line.aptoVendorId);
		}

		if (line.hasOwnProperty("vendorId") && line.vendorId != null && line.vendorId != "")
		{
			nlapiLogExecution("DEBUG", "Vendor specified");
			jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"entity",line.vendorId);
		}
		else if (line.hasOwnProperty("billTo") && line.billTo != null && line.billTo != "")
		{
			nlapiLogExecution("DEBUG", "JE BILL TO " + line.billTo);
			jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"entity",line.billTo);
		}


		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"department", line.department);
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"location",line.location) // market/cost center
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"class", line.classification); // category


		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, 'account', line.account); // account for this line item

		// only debit or credit should be present on one line
		if (isNaN(line.debit))
		{
			nlapiLogExecution("DEBUG", "JE Credit " + line.credit);
			jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, 'credit', line.credit);
		}
		if (isNaN(line.credit))
		{
			nlapiLogExecution("DEBUG", "JE Debit " + line.debit);
			jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, 'debit', line.debit);
		}

		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, 'memo', line.memo);
		jeRec.commitLineItem(GROUP_TYPE_LINE);

	}
}
/**
 * @summary Find je with specified internal Id and update records with NetSuite vendor IDs
 * @description In Apto, vendor is linked with contact only at the payment application time. This means that we would have an adjustment
 * coming from apto - update vendor information on previously created journal entires. This function implements this functionality
 *
 * @param internalId 	{string} NetSuite internal record id
 * @param aptoVendorId  {string} APTO vendor ID (was specified during record creation)
 * @param vendorId		{string} NetSuite vendor ID (updated by user at the payment time)
 *
 * @throws {RESTLetResult} if JE cannot be found, cannot be loaded or changed
 */
function jeUpdateVendorId(internalId, aptoVendorId, vendorId)
{
	// let's load journal entry
	var record =  nlapiLoadRecord(RECORD_TYPE_JOURNAL_ENTRY, internalId);
	nlapiLogExecution("DEBUG", "Journal Entry " + internalId + " Loaded");

	// go over all line items in search of ones we need

	var lineCount = record.getLineItemCount(GROUP_TYPE_LINE);
	for (var int = 1; int <= lineCount; int++) {

		// select line to read/write
		record.selectLineItem(GROUP_TYPE_LINE, int);

		var jeAPTOVendorId = record.getCurrentLineItemValue(GROUP_TYPE_LINE, "custcol_apto_vendor_id");
		nlapiLogExecution("DEBUG", "JE APTO Vendor ID is " + jeAPTOVendorId);

		if (jeAPTOVendorId == null)
		{
			nlapiLogExecution("DEBUG", "JE APTO Vendor ID is not stored - cannot update");
			/** type {RESTLetResult} **/
			var result = new RESTLetResult();
			result.errorCode = ERROR_CODE_CANNOT_UPDATE_VENDOR_INFO;
			throw result;
		}
		else
		{
			if (jeAPTOVendorId == aptoVendorId)
			{
				nlapiLogExecution("DEBUG", "Updating vendor id with " + vendorId);
				record.setCurrentLineItemValue(GROUP_TYPE_LINE, "entity", vendorId);
				record.commitLineItem(GROUP_TYPE_LINE);
			}
			else
				nlapiLogExecution("DEBUG", "APTO vendor id " + aptoVendorId + " does not match stored one");
		}



	}

	record.setFieldValue('approved', 'T');
	// save record
	nlapiSubmitRecord(record);
}

/**
 * Recreate journal entry.
 *
 * Since this is an adjustment, I am going to take data from existing
 * JE first, modify header and redo lines
 *
 * @param {string} transactionRecordId
 * @param {APTOSalesTransaction} aptoSalesTransaction
 */
function recreateJournalEntry(transactionRecordId, aptoSalesTransaction)
{
	nlapiLogExecution("DEBUG", "Recreating JE APTO transaction: ", JSON.stringify(aptoSalesTransaction));
	
	//ACES-690 Fix  -- remove the copy API and create JE from scratch, which subsidiary is changing
	if(!aptoSalesTransaction.invoice.hasOwnProperty('accountingClassification')){
		var je = nlapiCopyRecord(RECORD_TYPE_JOURNAL_ENTRY, transactionRecordId, {});
		je.setFieldValue("custbody_isssrunning","F"); // Per Peter, setting to false AYPC-918

		//DELOITTE FIX JIRA 309 -- TRANSACTION DATE FIX
		var subid = je.getFieldValue('subsidiary');
		var accountingPeriod = accountingPeriodSearch(dateInMillis2date(aptoSalesTransaction.invoice.transactionDateInMillis),subid);
		var enddate = new Date(nlapiLookupField('accountingperiod',accountingPeriod.id,'enddate'));

		var newdate = calculateCorrectTransDate(dateInMillis2date(aptoSalesTransaction.invoice.transactionDateInMillis),
		aptoSalesTransaction.invoice.processingDateInMillis?dateInMillis2date(aptoSalesTransaction.invoice.processingDateInMillis):null,
										dateInMillis2date(enddate.getTime()));
	}
	else{
		var newJE = new NSJournalEntry();
		var oldJE = nlapiLoadRecord('journalentry', transactionRecordId);
		nlapiLogExecution("DEBUG", "getting values from old JE");
		
		//DELOITTE FIX JIRA 309 -- TRANSACTION DATE FIX
		var subid = oldJE.getFieldValue('subsidiary');
		var accountingPeriod = accountingPeriodSearch(dateInMillis2date(aptoSalesTransaction.invoice.transactionDateInMillis),subid);
		var enddate = new Date(nlapiLookupField('accountingperiod',accountingPeriod.id,'enddate'));

		var newdate = calculateCorrectTransDate(dateInMillis2date(aptoSalesTransaction.invoice.transactionDateInMillis),
		aptoSalesTransaction.invoice.processingDateInMillis?dateInMillis2date(aptoSalesTransaction.invoice.processingDateInMillis):null,
										dateInMillis2date(enddate.getTime()));
										
		if (! aptoSalesTransaction.invoice.hasOwnProperty("currency")){
			nlapiLogExecution("DEBUG", "Getting currency from exiting JE");
			aptoSalesTransaction.invoice["currency"] = 'CAD';
		}
		if (! aptoSalesTransaction.invoice.hasOwnProperty("accountingPeriodId")){
			nlapiLogExecution("DEBUG", "Setting accounting period");
			aptoSalesTransaction.invoice["accountingPeriodId"] = accountingPeriod.id;
		}

		oldJE.selectLineItem(GROUP_TYPE_LINE, 1);

		if (! aptoSalesTransaction.invoice.hasOwnProperty("client"))
		{
			nlapiLogExecution("DEBUG", "Getting client from exiting JE");
			aptoSalesTransaction.invoice["client"] = oldJE.getCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_client");
		}

		if (! aptoSalesTransaction.invoice.hasOwnProperty("primaryBrokerId"))
		{
			nlapiLogExecution("DEBUG", "Getting primary broker from exiting JE");
			aptoSalesTransaction.invoice["primaryBrokerId"] = oldJE.getCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_employee");
		}
		aptoSalesTransaction.invoice.dealId  = oldJE.getCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_je_deal");
		
		
	}
	

	reverseJE(transactionRecordId, newdate);

	if(!aptoSalesTransaction.invoice.hasOwnProperty('accountingClassification')){
		adjustJE(je, aptoSalesTransaction);
		nlapiLogExecution("DEBUG", "Saving JE");
	
		je.setFieldValue('approved', 'T');
		nlapiSubmitRecord(je);
	}
	else{
		newJE.populateFromSalesTransaction(aptoSalesTransaction);
		var newJERecId = createNetSuiteJE(newJE);
		
	}

	// save record
	nlapiLogExecution("DEBUG", "Saving JE");
	
	//je.setFieldValue('approved', 'T');
	//nlapiSubmitRecord(je);
	nlapiLogExecution("DEBUG", "Done");
}

/**
 * Reverse JE
 *
 * @param {string} transactionRecordId - NS internal id of journal entry
 * @param {Date} date - reversal date
 * @param {Boolean} lChangeId - (optional) - change transaction ID
 * @param {string} recordType - (optional) - specify other JE record type as required
 */
function reverseJE(transactionRecordId, date, lChangeId, recordType)
{
	if (lChangeId == null)
		lChangeId = true;

	if (recordType == null)
		recordType = RECORD_TYPE_JOURNAL_ENTRY;

	nlapiLogExecution("DEBUG", "Reversing " + recordType, transactionRecordId + " " + date);
	var reversalDate = nlapiDateToString(date, DATE_MASK);

	if (lChangeId)
	{
		/** @type {nlobjRecord}  **/
		var je = nlapiLoadRecord(RECORD_TYPE_JOURNAL_ENTRY, transactionRecordId,  {recordmode: 'dynamic'});

		je.setFieldValue("reversaldate", reversalDate);

		nlapiLogExecution("DEBUG","Reversing " + recordType + " " + transactionRecordId, "Reversal date " + reversalDate + " set");

		nlapiLogExecution("DEBUG", "Reversing " + recordType + " " + transactionRecordId, "Changing Transaction ID");
		markJEAdjusted(je);

		nlapiLogExecution("DEBUG", "Reversing " + recordType + " " + transactionRecordId," submitting to NS");
		je.setFieldValue('approved', 'T');
		nlapiSubmitRecord(je);
	}
	else
	{
		nlapiSubmitField(recordType, transactionRecordId, 'reversaldate', reversalDate, true);
	}


	nlapiLogExecution("DEBUG", "Done");


}

/**
 * Change transaction ID to denote that it has been adjusted (Reversed)
 * @param {nlobjRecord} je - je that has been adjusted
 */
function markJEAdjusted(je)
{

	var tranId = je.getFieldValue("tranid");
	tranId += ".ADJ." + new Date().YYYYMMDDHHMMSS();

	if (tranId.length > 44)
		tranId = tranId.substring(tranId.length - 44);

	nlapiLogExecution("DEBUG", "Setting Tran Id to " + tranId);

	je.setFieldValue("externalid", tranId);
	je.setFieldValue("tranid", tranId);

}
/**
 * Update JE with values in aptoSalesTransaction
 * and re-do line items
 *
 * @param {nlobjRecord} je
 * @param aptoSalesTransaction
 */
function adjustJE(je, aptoSalesTransaction)
{
	// let's start with  changing header fields
	adjustJEHeader(je, aptoSalesTransaction);

	if (aptoSalesTransaction.hasOwnProperty('thirdPartyTaxes') &&
			aptoSalesTransaction.thirdPartyTaxes != null &&
			aptoSalesTransaction.thirdPartyTaxes.length > 0)
	{
		// line items were specified - need to recreate them
		adjustJELines(je, aptoSalesTransaction);
	}


	nlapiLogExecution("DEBUG", "Done");

}

/**
 * Adjust fields in JE header
 *
 * @param {nlobjRecord} je NetSuite record to modify
 * @param {APTOSalesTransaciton} aptoSalesTransaction APTO adjustment information
 */
function adjustJEHeader(je, aptoSalesTransaction)
{
	nlapiLogExecution("DEBUG", "Field-level adjustments (JE - HEADER)");

	if (aptoSalesTransaction.invoice.hasOwnProperty('accountingClassification'))
	{
		nlapiLogExecution("DEBUG", "Changing accounting classification(s)");
		// GM 8/4/2017 Only subsidiary has to be setup in the header
		je.setFieldValue("subsidiary", aptoSalesTransaction.invoice.accountingClassification.subsidiary);

//		}
//		for (subFieldName in aptoSalesTransaction.invoice.accountingClassification)
//		{
//			var nsFieldName = "";
//
//			nlapiLogExecution("DEBUG", "Adjusting " + subFieldName);
//			switch (subFieldName) {
//			case "subsidiary":
//				nsFieldName = "subsidiary";
//				break;
//			case "department":
//				nsFieldName = "department";
//				break;
//			case "market":
//				nsFieldName = "location";
//				break;
//			case "category":
//				nsFieldName = "class";
//			default:
//				break;
//			}
//			nlapiLogExecution("DEBUG", "New Value " + aptoSalesTransaction.invoice.accountingClassification[subFieldName]);
//			je.setFieldValue(nsFieldName, aptoSalesTransaction.invoice.accountingClassification);
//		}
	}

	if (aptoSalesTransaction.invoice.hasOwnProperty('transactionDateInMillis'))
	{
		nlapiLogExecution("DEBUG", "Changing posting preriod");
		var subId = je.getFieldValue('subsidiary');
		var fieldValue = accountingPeriodSearch(dateInMillis2date(aptoSalesTransaction.invoice.transactionDateInMillis), subId).id;
		je.setFieldValue("postingperiod", fieldValue);
		nlapiLogExecution("DEBUG", "New Value " + fieldValue);

		//DELOITTE FIX JIRA 309 -- TRANSACTION DATE FIX
		var enddate = new Date(nlapiLookupField('accountingperiod',fieldValue,'enddate'));
		var newdate = calculateCorrectTransDate(dateInMillis2date(aptoSalesTransaction.invoice.transactionDateInMillis),
					aptoSalesTransaction.invoice.processingDateInMillis?dateInMillis2date(aptoSalesTransaction.invoice.processingDateInMillis):null,
					dateInMillis2date(enddate.getTime()));
		je.setFieldValue('trandate', nlapiDateToString(newdate, DATE_MASK));

	}

	// setting tran id to match APTO invoice

	// jeRec.setFieldValue("custbody_apto_invoice_test",je.aptoInvoice);
	nlapiLogExecution("DEBUG", "Setting transaction id to " + aptoSalesTransaction.invoice.invoiceNo);
	je.setFieldValue("tranid",aptoSalesTransaction.invoice.invoiceNo);
	je.setFieldValue("externalid","JE" + aptoSalesTransaction.invoice.invoiceNo);

	nlapiLogExecution("DEBUG", "Field-level adjustments (JE - HEADER) Done");
}

/**
 * Adjust line items in selected NetSuite JE
 *
 * @param {nlobjRecord} jeRec NetSuite record to adjust
 * @param {APTOSalesTransaciton} aptoSalesTransaction Apto adjustment information
 */
function adjustJELines(jeRec, aptoSalesTransaction)
{
	nlapiLogExecution("DEBUG", "Adjusting je line items");
	// if we don't have it - we need to get client from existing transaction

	jeRec.selectLineItem(GROUP_TYPE_LINE, 1);

	if (! aptoSalesTransaction.invoice.hasOwnProperty("client"))
	{
		nlapiLogExecution("DEBUG", "Getting client from exiting JE");
		aptoSalesTransaction.invoice["client"] = jeRec.getCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_client");
	}

	if (! aptoSalesTransaction.invoice.hasOwnProperty("primaryBrokerId"))
	{
		nlapiLogExecution("DEBUG", "Getting primary broker from exiting JE");
		aptoSalesTransaction.invoice["primaryBrokerId"] = jeRec.getCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_employee");
	}


	if (! aptoSalesTransaction.invoice.hasOwnProperty("accountingClassification"))
	{
		nlapiLogExecution("DEBUG", "Getting accounting classification from exiting JE");

		aptoSalesTransaction.invoice["accountingClassification"] = {};
		aptoSalesTransaction.invoice["accountingClassification"]["subsidiary"] = jeRec.getFieldValue("subsidiary");
		aptoSalesTransaction.invoice["accountingClassification"]["department"] = jeRec.getCurrentLineItemValue(GROUP_TYPE_LINE,"department");
		aptoSalesTransaction.invoice["accountingClassification"]["market"] = jeRec.getCurrentLineItemValue(GROUP_TYPE_LINE,"location");
		aptoSalesTransaction.invoice["accountingClassification"]["category"] = jeRec.getCurrentLineItemValue(GROUP_TYPE_LINE,"class");

	}

	aptoSalesTransaction.invoice.dealId  = jeRec.getCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_je_deal");

	// delete existing lines first
	deleteJELines(jeRec);

	// and now recreate them
	var nsJE  = new NSJournalEntry();

	nsJE.populateFromJEAndSalesTransaction(jeRec, aptoSalesTransaction);

	createJELineItems(jeRec, nsJE);

	// var id = nlapiSubmitRecord(jeRec);
	// nlapiLogExecution("DEBUG", "JE record id " + id);

	nlapiLogExecution("DEBUG", "done");
}

/**
 * Delete existing line items, so they can be recreated
 * @param {nlobjRecord} je NetSuite journal entry record
 */
function deleteJELines(je)
{
	// let's delete existing line items

	var lineCount = je.getLineItemCount(GROUP_TYPE_LINE);

	nlapiLogExecution("DEBUG", "Deleting " + lineCount +  " existing lines");
	for (var int = 1; int <= lineCount; int++) {
		je.removeLineItem(GROUP_TYPE_LINE, 1);
	}

	nlapiLogExecution("DEBUG", "done");
}

/**
 * Create JE as a result of APTO sales transaction adjustment (Canada only)
 * @see salesTaxLiabilityJE
 *
 * @param {string} invoiceId
 * @param {APTOTransaction} aptoSalesTransaction
 */
function createJEforInvoice(invoiceId, aptoSalesTransaction)
{
	nlapiLogExecution("DEBUG", "Creating JE (was not needed before)", JSON.stringify(aptoSalesTransaction));
	// read invoice already created
	nlapiLogExecution("DEBUG", "Loading invoice " + invoiceId);
	var invoice = nlapiLoadRecord(RECORD_TYPE_INVOICE, invoiceId);
	nlapiLogExecution("DEBUG", "Reading data from invoice");

	populateFromNSInvoice(aptoSalesTransaction.invoice, invoice);

	salesTaxLiabilityJE(aptoSalesTransaction);

	nlapiLogExecution("DEBUG", "done");
}

/**
 * Create JE to offset payment record's GL impact on account.
 *
 * @param {nlobjRecord} payment NetSuite payment record
 * @param {string} destinationAccount  account to move debit to
 * @returns {string} NetSuite internal ID of newly created payment
 */
function createSweepJEfromPayment(payment, destinationAccount)
{

	nlapiLogExecution("DEBUG", "Creating NS journal entry", "Working on header");

	var jeRec = nlapiCreateRecord(RECORD_TYPE_JOURNAL_ENTRY); // , {recordmode: 'dynamic'}
	jeRec.setFieldValue("approved", 'T');
	jeRec.setFieldValue("currency", payment.getFieldValue("currency"));

	// setup accounting attributes
	jeRec.setFieldValue("subsidiary", payment.getFieldValue("subsidiary"));


	createJELineForPayment(jeRec, payment, 'debit', destinationAccount);

	createJELineForPayment(jeRec, payment, 'credit', payment.getFieldValue("account"));

	nlapiLogExecution("DEBUG", "Submitting record to NS");
	try
	{
		jeRec.setFieldValue('approved', 'T');
		var id = nlapiSubmitRecord(jeRec);
		nlapiLogExecution("DEBUG", "Success","record id " + id);

		return id;
	}
	catch (e)
	{
		nlapiLogExecution("DEBUG", "Error creating JE ", e.getCode() + " " + e.getDetails());
		throw e;
	}

}

/**
 * Create line item for sweep JE
 *
 * @param {nlobjRecord} jeRec journal entry we are working on
 * @param {nlobjRecord} payment payment record
 * @param lineType debit or credit
 * @param account amount to use on JE line
 */
function createJELineForPayment(jeRec, payment, lineType, account)
{
	nlapiLogExecution("DEBUG", "Creating NS journal entry", "Working on " + lineType);

	jeRec.selectNewLineItem(GROUP_TYPE_LINE);

	jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_client", payment.getFieldValue("custcol_client")); // client
	jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_deal_line_test",payment.getFieldValue("custcol_je_deal"));


	// jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"custcol_employee",line.employeeId);


	jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"department",  payment.getFieldValue("department"));
	jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"location",payment.getFieldValue("location")) // market/cost center
	jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"class", payment.getFieldValue("class")); // category

	jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, 'account', payment.getFieldValue("account")); // acount for this line item

	jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, lineType, account);
	jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, 'memo', payment.getFieldValue("memo"));

	jeRec.commitLineItem(GROUP_TYPE_LINE);

}

/**
 * Use this function to break invoice / je connection
 *
 * @param {string} jeId NS Internal ID of JE
 */
function removeInvoiceAssociationFromJE(jeId)
{
	var record =  nlapiLoadRecord(RECORD_TYPE_JOURNAL_ENTRY, jeId);
	var billToId = "";

	nlapiLogExecution("DEBUG", "Journal Entry " + jeId + " Loaded");

	// go over all line items in search of ones we need

	var lineCount = record.getLineItemCount(GROUP_TYPE_LINE);
	for (var int = 1; int <= lineCount; int++) {

		// select line to read/write
		record.selectLineItem(GROUP_TYPE_LINE, int);

		if (billToId == "")
		{
			var billToId = record.getCurrentLineItemValue(GROUP_TYPE_LINE, "entity");
			nlapiLogExecution("DEBUG", "BILL TO id is " + billToId);
		}

		nlapiLogExecution("DEBUG", "Removing entity reference");
		record.setCurrentLineItemValue(GROUP_TYPE_LINE, "entity", "");
		record.commitLineItem(GROUP_TYPE_LINE);
	}

	nlapiLogExecution("DEBUG", "Saving JE");
	record.setFieldValue('approved', 'T');
	var id = nlapiSubmitRecord(record);

	nlapiLogExecution("DEBUG", "Reloading JE " + id);
	var record =  nlapiLoadRecord(RECORD_TYPE_JOURNAL_ENTRY, id);

	for (var int = 1; int <= lineCount; int++) {

		// select line to read/write
		record.selectLineItem(GROUP_TYPE_LINE, int);

		nlapiLogExecution("DEBUG", "Putting back entity reference");
		record.setCurrentLineItemValue(GROUP_TYPE_LINE, "entity", billToId);
		record.commitLineItem(GROUP_TYPE_LINE);
	}

	nlapiLogExecution("DEBUG", "Saving JE");
	record.setFieldValue('approved', 'T');
	id = nlapiSubmitRecord(record);

	nlapiLogExecution("DEBUG", "Done");

}

/**
 * Get GL impact of the transaction
 *
 * @param {string} tranId - NetSuite internal ID of the transaction
 *
 * @returns {nlobjSearchResult[]} search result
 */
function getGLImpact(tranId)
{
	var columns = new Array();
	var kind = 'transaction';


	// log("Searching for bill transactions");

	var filterExpression = [['internalid', 'is', tranId]];

	nlapiLogExecution("DEBUG", "Getting GL Impact", tranId);

	columns[COL_ACCOUNT] = new nlobjSearchColumn('account', null, 'group');
	columns[COL_CURRENCY] = new nlobjSearchColumn('currency',null,'group' );
	columns[COL_DEPARTMENT] = new nlobjSearchColumn('department',null,'group' );
	columns[COL_LOCATION] = new nlobjSearchColumn('location',null,'group' );
	columns[COL_CLASS] = new nlobjSearchColumn('class',null,'group');
	columns[COL_CREDIT] = new nlobjSearchColumn('creditamount',null,'sum').setFunction("roundToHundredths");
	columns[COL_DEBIT] = new nlobjSearchColumn('debitamount',null,'sum').setFunction("roundToHundredths");
	columns[COL_FX_AMOUNT] = new nlobjSearchColumn('fxamount',null,'sum').setFunction("roundToHundredths");
	columns[COL_SIGNED_AMOUNT] = new nlobjSearchColumn('signedamount',null,'sum').setFunction("roundToHundredths");


	var results = nlapiSearchRecord(kind, null, filterExpression, columns);

	if (results != null && results.length > 0)
		nlapiLogExecution("DEBUG", "GL Impact", results.length + " lines found");

	return results;
}

/**
 * Create GL impact reversal JE header
 *
 * @param {TransactionInfo} transactionInfo
 * @param {nlobjRecord} jeRec NetSuite journal entry that is populated with this information
 * @param {string} extIDprefix external ID prefix
 */
function createdReversingJEHeader(transactionInfo, jeRec, extIDprefix,creditMemoDetails)
{
	var date = new Date();

	var tranId = transactionInfo.tranId;

	if (tranId == null || tranId == "")
		tranId = transactionInfo.recordType.toUpperCase() + ".VOID." + new Date().YYYYMMDDHHMMSS();

	nlapiLogExecution("DEBUG", "GL Impact Reversal", "Creating JE " + tranId);
	
	//Deloitte Fix for the ticket ACES-640
	
	nlapiLogExecution("DEBUG", "transactionInfo.recordType header", transactionInfo.recordType);
	

	
	// log("Transaction Currency", searchresult.getValue(columns[COL_CURRENCY]));
	// log("Creating NS journal entry header", tranId);

	// setup accounting attributes
	jeRec.setFieldValue("subsidiary", transactionInfo.subsidiary);
	jeRec.setFieldValue("approved", 'T');
	
	
	//Deloitte Fix for the ticket ACES-640
	
	if(transactionInfo.recordType == 'creditmemo')
	{
	
	nlapiLogExecution("DEBUG","creditMemoInvoice ...............", creditMemoDetails.InvoiceId);
	nlapiLogExecution("DEBUG","creditMemoDealNumber...............", creditMemoDetails.DealId);
	nlapiLogExecution("DEBUG","dealName.................", creditMemoDetails.dealName);
	
	jeRec.setFieldValue("custbody_apto_invoice",creditMemoDetails.InvoiceId);
	jeRec.setFieldValue("custbody_apto_invoice_test",creditMemoDetails.InvoiceId);
	jeRec.setFieldValue("custbody_deal",creditMemoDetails.DealId);
	jeRec.setFieldValue("custbodyinv_deal_name",creditMemoDetails.dealName);
	}
	
	// jeRec.setFieldValue("trandate", accountingPeriod.endDate); // AYPC-867
	// jeRec.setFieldValue("postingperiod",accountingPeriod.id);

	jeRec.setFieldValue("currency", transactionInfo.currency);

	jeRec.setFieldValue("tranid",tranId);
	// jeRec.setFieldValue("externalid",tranId);

	jeRec.setFieldValue("memo",  transactionInfo.recordType.toUpperCase() +  " Void JE");

}

/**
 * Create new line for JE
 *
 * @param isCredit {boolean}
 * @param amount {number}
 * @param searchresult {nlobjSearchResult} single line of reversal data
 * @param columns {nlobjSearchColumn[]} array of search columns (used to retrieve data from search result)
 * @param jeRec NetSuite journal entry record getting modifed
 *
 * @param {TransactionInfo} transactionInfo
 */
function createdGLReversalJELine(isCredit, amount, searchresult, columns, jeRec, transactionInfo, creditMemoDetails)
{
	// amount = round(amount,2);

	

	nlapiLogExecution("DEBUG", isCredit?"Credit":"Debit", amount + " account " +  searchresult.getValue(columns[COL_ACCOUNT]));

	jeRec.selectNewLineItem(GROUP_TYPE_LINE);

	if (searchresult.getValue(columns[COL_DEPARTMENT]) != "")
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"department", searchresult.getValue(columns[COL_DEPARTMENT]));
	else
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"department", 19);

	if (searchresult.getValue(columns[COL_LOCATION]) != "")
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"location",searchresult.getValue(columns[COL_LOCATION])) // market/cost center
	else
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"location", 100);

	if (searchresult.getValue(columns[COL_CLASS]) != "")
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"class", searchresult.getValue(columns[COL_CLASS])); // category
	else
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE,"class",1);

	jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, 'account', searchresult.getValue(columns[COL_ACCOUNT])); // acount for this line item

	if (isCredit)
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, 'credit', amount);
	else
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, 'debit', amount);

	jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, 'entity', transactionInfo.entity);
	
	//Deloitte Fix for the ticket ACES-640
	
	nlapiLogExecution("DEBUG", "transactionInfo.recordType line", transactionInfo.recordType);
	if(transactionInfo.recordType == 'creditmemo')
	{
		
		nlapiLogExecution("DEBUG","creditMemoInvoice..............", creditMemoDetails.InvoiceId);
		nlapiLogExecution("DEBUG","creditMemoDealNumber.............", creditMemoDetails.DealId);
		nlapiLogExecution("DEBUG","dealName.................", creditMemoDetails.dealName);
		
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, 'custcol_apto_invoice', creditMemoDetails.InvoiceId);
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, 'custcol_je_deal', creditMemoDetails.DealId);
		jeRec.setCurrentLineItemValue(GROUP_TYPE_LINE, 'custcol_deal_name', creditMemoDetails.dealName);
	}
	jeRec.commitLineItem(GROUP_TYPE_LINE);
}

/**
 * Create JE that would be oposite to data in results (reversal)
 *
 * @param {TransactionInfo} transactionInfo - must have data about transaction we are reversing
 * @param {nlobjSearchResult[]} searchresults NS search results @see getGLImpact
 *
 * @returns {string} Journal Entry internal id
 */
function reverseGLImpactJE(transactionInfo, searchresults)
{
	var i = 0;

	var nCredit = math.bignumber(0);
	var nDebit = math.bignumber(0);

	var columns = searchresults[0].getAllColumns(); // array of search columns

	var jeRec = nlapiCreateRecord("journalentry", {recordmode: 'dynamic'});

	var jeId = null;
	
	//Deloitte Fix for the ticket ACES-640
	
	var tranId = transactionInfo.tranId;
	var creditmemoId = transactionInfo.id;
	
	nlapiLogExecution("DEBUG", "GL Impact Reversal", "Creating JE " + tranId);
	nlapiLogExecution("DEBUG", "Credit Memo id",creditmemoId);
	
	nlapiLogExecution("DEBUG", "transactionInfo.recordType main function", transactionInfo.recordType);
	
	//Deloitte Fix for the ticket ACES-640
	var creditMemoDetails;
	
	if(transactionInfo.recordType == 'creditmemo')
	{
		var creditMemoDetails = nlapiLookupField('creditmemo',creditmemoId,['custbody_apto_invoice','custbody_deal'])
		
		var InvoiceId = creditMemoDetails.custbody_apto_invoice;
		var DealId = creditMemoDetails.custbody_deal;
		
		nlapiLogExecution("DEBUG", "creditMemoInvoice..........", InvoiceId);
		nlapiLogExecution("DEBUG", "creditMemoDealNumber.............", DealId);
		
		var dealName = nlapiLookupField('customrecord_deal',DealId,'custrecord_deal_name');
		nlapiLogExecution("DEBUG", "dealName............", dealName);
		
		
		creditMemoDetails = {
			'InvoiceId' : InvoiceId,
			'DealId' : DealId,
			'dealName' : dealName
		}
	}
	// create je header
	createdReversingJEHeader(transactionInfo, jeRec,"VOID",creditMemoDetails)

	do {

		var fxAmount = Math.abs(searchresults[i].getValue(columns[COL_FX_AMOUNT]));

		if (searchresults[i].getValue(columns[COL_SIGNED_AMOUNT]) > 0)
		{

			nDebit = math.add(nDebit,  math.bignumber(fxAmount));

			createdGLReversalJELine(true, fxAmount, searchresults[i], columns, jeRec, transactionInfo,creditMemoDetails);
		}
		if (searchresults[i].getValue(columns[COL_SIGNED_AMOUNT]) < 0)
   		{
			nCredit = math.add(nCredit, math.bignumber(fxAmount));

			createdGLReversalJELine(false, fxAmount, searchresults[i], columns, jeRec, transactionInfo,creditMemoDetails);
   		}
		i++;

		/// checkUsage();

	} while (i < searchresults.length);


	nlapiLogExecution("DEBUG", "Transaction Totals", "Credit : "  + math.number(nCredit) + " Debit " + math.number(nDebit));


	jeRec.setFieldValue('approved', 'T');
	jeId = nlapiSubmitRecord(jeRec);

	nlapiLogExecution("DEBUG", "JE Created", jeId);

	return jeId;

}
/**
 * Create JE that has reversing impact on transaction. Code for implementation is borrowed from
 * data migration reversal project
 *
 * @param {TransactionInfo} TransactionInfo NetSuite transaction to reverse GL impact of
 *
 * @returns {string} NetSuite internal ID of reversal JE
 */
function createJEtoReverseGLImpact(transactionInfo)
{
	nlapiLogExecution("DEBUG", "Creating GL Impact Reversal", JSON.stringify(transactionInfo));

	var glImpact = getGLImpact(transactionInfo.id);
	var jeID =  null;

	if (glImpact != null && glImpact.length > 0)
    {	nlapiLogExecution("DEBUG", "Got GL impact");
		jeID = reverseGLImpactJE(transactionInfo, glImpact);
    }

	return jeID;

}