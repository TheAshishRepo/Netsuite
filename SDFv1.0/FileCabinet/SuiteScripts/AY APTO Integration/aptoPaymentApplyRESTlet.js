/**
 * @summary <b>RESTLet</b>
 *
 * @description APTO Apply Payment API call. Accepts payment information and array of invoices (id and amount to apply or un-apply)
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       23 Jan 2016     georgem		   Apply payment to one or more invoices
 *
 * @module aptoPaymentApplyRESTLet
 *
 *
 * @requires aptoSalesTransactionDefs
 * @requires aptoSalesTransactionLib
 * @requires aptoVoidTransaction
 * @requires aptoJE
 *
 * @tutorial aptoPaymentApplyRESTLetRequest.schema
 * @tutorial aptoRESTLetResponse.schema
 */

 /**
  * Apply payment to one or more invoices. Application amount is incremental, it can be positive or negative. Custom payment types
  * (**Co-Broker Trust Payment** or **Write-Off**) are created as *Journal Entries* that are applied or reversed, based on application
  * amount
  *
  * @param {APTOPaymentApplication} dataIn Parameter object
  * @returns {RESTLetResult} result of operation
  */
function postRESTlet(dataIn) {

	var result;

	var restletInfo = new RESTLetInfo();

	restletInfo.logInvocation("aptoPaymentApplyRESTLet", "post", dataIn);


	result = transactionWrapper(function(dataIn){ return applyPayment(dataIn)}, null, dataIn);

	restletInfo.logEOE(result);

	return JSON.stringify(result);


}
