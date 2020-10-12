/**
 * <b>RESTLet</b>
 *
 * @description Apto Process Brokerage Sale API call. <b>Most important integration call</b>
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       7 Jan 2016     georgem		   Initial version - leaving only RESTLet code and error handling here
 *
 * 1.1		 16 Feb 2016     georgem			adding put and delete methods
 * @module aptoSalesTransactionRESTLet
 *
 * @requires aptoSalesTransaction
 * @requires aptoModifyTransaction
 * @requires aptoSalesTransactionDefs
 * @requires aptoSalesTransactionLib
 * @requires aptoGetAdjPostingPeriodScript
 * @requires aptoVoidTransaction
 * @requires aptoInvoice
 * @requires aptoCreditMemo
 * @requires aptoJE
 *
 * @tutorial aptoSalesTransactionRESTLetRequest.schema
 * @tutorial aptoRESTLetResponse.schema
 */


/**
 * @summary HTTP POST Method
 *
 * @description Create new sales transaction/Invoice Milestone Event Processing
 *
 * Apto would call this API end point when new invoice is created or when invoice goes thru milestone event.
 *
 * <b>offsetInvoice</b> property holds ID of the previous version this invoice; if it's present - RESTLet would create <b>Credit Memo</b>
 * and apply it to NetSuite invoice with internal id <b>offsetInvoice</b>
 *
 * <b>thirdPartyTaxes</b> property hold information about third party tax liability related to this transaction.
 * For <b>Canadian</b> transactions only, if we have co-broker or client fee share (i.e. 3rd party), Apto would calculate 3rd party's
 * portion of tax liability and send it in this object
 *
 * <b>invoice</b> property holds information about accounting invoice in abstracted form. Invoice header information is presented
 * as set of properties and lines are stored as an array of object - every invoice line has it's own set of properties
 *
 * <b>batchTransactionId</b> property if optional and so far has not being used. It was intented to allow Apto to do calls to
 * NetSuite in batch mode (and possibly with separate delivery of results)
 *
 * Under normal mode of operations, invoices are always posted into posting period driven by transaction date. During data migration,
 * code is using same logic and adjustment, and if transaction date falls into closed period, code would search for the earliest open posting
 * period to use for this transaction
 *
 * @param  {APTOTransaction} dataIn Brokerage transaction information
 * @returns {RESTLetResult} Operation results in common format
 *
 */
function postRESTlet(dataIn)
{

	var result = dispatchCall("post", dataIn);

	return JSON.stringify(result);
}

/**
 * @summary HTTP DELETE Method
 *
 * @description Void already existing sales transaction. Not currently used by Apto
 *
 * @param {APTOVoidInvoice} dataIn  Information about invoice that should be voided
 * @returns {RESTLetResult} Operation results in common format
 */
function deleteRESTlet(dataIn) {

	var result = dispatchCall("delete", dataIn);

	return JSON.stringify(result);
}

/**
 * @summary HTTP PUT Method
 *
 * @description Update existing sales transaction. Apto calls this API end point every time adjustment to sales transaction
 * requires changes to invoices or related JE. While this call uses same parameter as POST HTTP Method, if should only receive
 * changed fields in its payload. Based on information coming in, system determines how to process this specific adjustment. Change to invoice date is the only "simple"
 * adjustment that is done without recreating invoice, in all other cases current item would be offset with <b>Credit Memo</b>,
 * renamed (.ADJ. and time stamp would be added to *tranid* and *externalid*) and new invoice (and if needed Journal Entries)
 * would be created to show adjustment. Adjustment is posted into earliest open posting period (valid for invoice we are adjusting)
 *
 * @param  {APTOTransaction} dataIn Adjustment information
 * @returns {RESTLetResult} Operation results in common format
 */
function putRESTlet(dataIn) {

	var result = dispatchCall("put", dataIn);

	return JSON.stringify(result);
}

/**
 * Call processing based on how restlet was invoked
 *
 * @param {string} httpMethod call type
 * @param {object} dataIn  data received
 *
 * @returns {RESTLetResult} result in general format
 */
function dispatchCall(httpMethod, dataIn)
{
	var restletInfo = new RESTLetInfo();

	restletInfo.logInvocation("aptoSalesTransactionRESTLet", httpMethod, dataIn);

	var result = null;

	switch (httpMethod) {
		case "post":
			var result = processOneSalesTransaction(dataIn);
			break;
		case "put":
			var result = adjustOneSalesTransaction(dataIn);
			break;
		case "delete":
			var result = voidOneSalesTransaction(dataIn);
			break;
	}

	restletInfo.logEOE(result);

	return result;

}