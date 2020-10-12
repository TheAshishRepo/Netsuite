/**
 * Library of functions related to Credit Memo operations
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       08 Jan 2016     georgem		   Code related to handling Credit Memos in NetSuite
 *
 * @module aptoCreditMemo
 * @requires aptoSalesTransactionDefs
 * @requires aptoJE
 */
/**
 * Create credit memo and apply it to invoice.
 * @param {string} invoiceId  NetSuite internal id of the invoice
 * @param {string} cmMode operation mode. See constants defined above
 * @param {NSAccountingPeriod} accountingPeriod - optional, accounting period to create this CM in
 * @param {date} aptoTransactionDate - Transaction date sent by Apto - ACES-309 transaction date fix - DELOITTE ACES-309
 * @param {date} aptoProcessingDate - Processing date sent by Apto - ACES-309 transaction date fix - DELOITTE ACES-309
 */
// testing webhook on commit on 10/12
function createCreditMemo4Invoice(invoiceId, cmMode, accountingPeriod, aptoTransactionDate,aptoProcessingDate)
{
	if (cmMode == null)
		cmMode = CM_MILESTONE;

	var creditMemo = nlapiTransformRecord(RECORD_TYPE_INVOICE, invoiceId, RECORD_TYPE_CREDIT_MEMO, null);

	creditMemo.setFieldValue("custbody_isssrunning","F"); // Per Peter, setting to false AYPC-918

	nlapiLogExecution("DEBUG", "Creating Credit Memo", cmMode);
	nlapiLogExecution('DEBUG', "Accountin Period parameter value: ", accountingPeriod);

	var cmMemos = new CMMemos();

	var memo = cmMemos.getValue(cmMode);

	var aptoInvoiceNo = getAPTOInvoiceNumber(invoiceId);


	if (aptoInvoiceNo != null)
	{
		creditMemo.setFieldValue("tranId",aptoInvoiceNo);
	}
	creditMemo.setFieldValue("memo",memo);

	if (aptoTransactionDate != null && aptoTransactionDate != "")
	{
		nlapiLogExecution("DEBUG", "Apto Transaction Date", aptoTransactionDate);
		creditMemo.setFieldValue("custbody_ay_apto_trans_date", aptoTransactionDate);
	}


	if (cmMode == CM_ADJUSTMENT || accountingPeriod != null) // AYPC-392 - using first available adjusting period
	{
		if (cmMode == CM_ADJUSTMENT)
		{
			nlapiLogExecution("DEBUG", "Creating Credit Memo", "Looking up adjustment accounting period");

			accountingPeriod = new NSAccountingPeriod();
			accountingPeriod.setData(getAdjPeriodForNSInvoice(invoiceId));

		}
		else
			nlapiLogExecution("DEBUG", "Creating Credit Memo", "Using posting period " + accountingPeriod.name);
       var postingPeriodId = accountingPeriod.id;
		var transDate = accountingPeriod.lastSunday; // accountingPeriod.endDate;
		//Setting the CM trandate to the apto trandate instaed of last sunday in the previous line
		//var transDate = nlapiDateToString(new Date('06/29/2019'),DATE_MASK); 
		nlapiLogExecution('DEBUG', 'Accountingperiod on CM file: ', JSON.stringify(accountingPeriod));

		//var today = new Date();
		//var transactionDate = today;

		//Deloitte Jira 309:Change made according to the new logic
		var enddate = dateInMillis2date(new Date(accountingPeriod.endDate).getTime());
		nlapiLogExecution('DEBUG', 'END DATE in CM ',accountingPeriod.endDate + "  " + new Date(accountingPeriod.endDate) + "  " + enddate );
		
		var transactionDate = nlapiDateToString(calculateCorrectTransDate(aptoTransactionDate,aptoProcessingDate,enddate), DATE_MASK);


		nlapiLogExecution("DEBUG", "Creating Credit Memo", "Transaction Date " + transactionDate);

		//TODO uncomment next few lines after Apto is live
		/// nlapiLogExecution("DEBUG", "Creating Credit Memo", "Transaction Date " + transactionDate.getTime() + " today is " + today.getTime());
		/// if (today.getTime() < transactionDate.getTime()) // in theory this is only possible if adjustment is done in current month
		/// {
		///   	transactionDate = nlapiDateToString(today, DATE_MASK);
		///}

		creditMemo.setFieldValue("postingperiod", postingPeriodId);
		creditMemo.setFieldValue("trandate", transactionDate);
	}
	//DELOITTE FIX - 3340 - SET TRANDATE OF ORIGINAL RECORD FOR A VOID DURING ROLLBACK
	else if(cmMode == CM_VOID && accountingPeriod == null){
		creditMemo.setFieldValue('trandate', nlapiLookupField('invoice', invoiceId, 'trandate'));
		creditMemo.setFieldValue('postingperiod', nlapiLookupField('invoice', invoiceId, 'postingperiod'));
	}

	var recordId = nlapiSubmitRecord(creditMemo);


	nlapiLogExecution("DEBUG", "Credit memo " + recordId + " created");
	return recordId;
}

/**
 * Apply available balance from credit memo to invoice
 *
 * @param cmId
 * @param invoiceId
 */
function applyCMBalanceToInvoice(cmId, invoiceId)
{
	nlapiLogExecution("DEBUG", "Loading credit memo", cmId);

	var cm = nlapiLoadRecord(RECORD_TYPE_CREDIT_MEMO, cmId);

	// let's find out how many outstanding invoices do we have
	var invoiceCount = cm.getLineItemCount(GROUP_TYPE_APPLY);

	for (var int = 1; int <= invoiceCount; int++) {
	   // internal id of the invoice stored in this line
	   var internalid = cm.getLineItemValue(GROUP_TYPE_APPLY, "internalid", int);

	   if (internalid == invoiceId)
	   {
		   nlapiLogExecution("DEBUG", "Found invoice in apply list");
		   cm.selectLineItem(GROUP_TYPE_APPLY, int);
		   cm.setCurrentLineItemValue(GROUP_TYPE_APPLY, "total", cm.getFieldValue("unapplied"));
		   cm.setCurrentLineItemValue(GROUP_TYPE_APPLY, "apply", "T");

		   cm.commitLineItem(GROUP_TYPE_APPLY);
		   nlapiSubmitRecord(cm);
		   break;
	   }
	}

	nlapiLogExecution("DEBUG", "Done");
}

/**
 * Remove credit memo applications
 *
 * @param {string} creditMemoId - NetSuite internal ID of the record
 */
function unApplyCreditMemo(creditMemoId)
{
	nlapiLogExecution("DEBUG", "Un-Applying credit memo from all invoices",creditMemoId);

	var isChanged = false;

	var cm = nlapiLoadRecord(RECORD_TYPE_CREDIT_MEMO, creditMemoId);

	while (true)
	{
		var line = cm.findLineItemValue(GROUP_TYPE_APPLY, "apply", "T");

		if (line > 0)
		{
			isChanged = true;

			nlapiLogExecution("DEBUG", "Found invoice on line", line);

			cm.selectLineItem(GROUP_TYPE_APPLY, line);
			cm.setCurrentLineItemValue(GROUP_TYPE_APPLY, "apply", "F");
			cm.commitLineItem(GROUP_TYPE_APPLY);
		}
		else
			break;

	}

	if (isChanged)
		nlapiSubmitRecord(cm);

	nlapiLogExecution("DEBUG", "Un-Applying invoices from credit memo", "Done");
}
/**
 * Load NS invoice and get APTO invoice number from it
 *
 * @param {string} invoiceId - NetSuite internal number
 * @returns {string} Apto invoice number
 *
 * @todo move to aptoInvoice.js
 */
function getAPTOInvoiceNumber(invoiceId)
{
	// var invoice = nlapiLoadRecord(RECORD_TYPE_INVOICE, invoiceId);
	var aptoInvoiceNumber = nlapiLookupField(RECORD_TYPE_INVOICE, invoiceId, "externalId");	 // invoice.getFieldValue("externalId");

	return aptoInvoiceNumber;
}

/**
 * Void credit memo by creating JE with reversing GL impact
 * And applying it.
 *
 * @param {string} cmId NetSuite internal ID of credit memo
 */
function voidCreditMemo(cmId)
{
	nlapiLogExecution("DEBUG", "Voding Credit Memo " + cmId, "Start");

	var transactionInfo = new TransactionInfo();
	transactionInfo.initData(RECORD_TYPE_CREDIT_MEMO, cmId);
	var jeId = createJEtoReverseGLImpact(transactionInfo);

	nlapiLogExecution("DEBUG", "Reversing JE", jeId + " created");

	applyCMBalanceToInvoice(cmId, jeId);

	// need to check if line items have allocations
	reverseCMAllocations(transactionInfo);

	nlapiLogExecution("DEBUG", "Voding Credit Memo " + cmId, "Done");
}

/**
 * Check Credit Memo for assocated allocations
 * And reverse them if found
 *
 * @param {TransactionInfo} transactionInfo - transaction information
 */
function reverseCMAllocations(transactionInfo)
{
	nlapiLogExecution("DEBUG", "Loading " + transactionInfo.recordType," id " + transactionInfo.id);
	var cm = nlapiLoadRecord(transactionInfo.recordType, transactionInfo.id);


	// let's find out how many lines do we have
	var invoiceCount = cm.getLineItemCount(GROUP_TYPE_ITEM);
	var reversalDate = new Date();

	for (var int = 1; int <= invoiceCount; int++) {
	   // internal id of the invoice stored in this line
	   var allocationJEID = cm.getLineItemValue(GROUP_TYPE_ITEM, "custcol_assoc_ic", int);

	   if (allocationJEID != null && allocationJEID != "")
	   {
		   reverseJE(allocationJEID, reversalDate, false, RECORD_TYPE_ADV_INETRCOMPANY_JOURNAL_ENTRY);
	   }
	}

	nlapiLogExecution("DEBUG", "Done");

}
