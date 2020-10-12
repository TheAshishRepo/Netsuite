/**
 * <b>RESTLet</b>
 *
 * Operations related to Customer Payments (Cash Receipts)
 *
 * Version    Date            Author           Remarks
 * 1.00       22 Jan 2016     georgem
 *
 * @module aptoPaymentRESTlet
 *
 * @requires aptoPayment
 * @requires aptoSalesTransactionDefs
 * @requires aptoSalesTransactionLib
 * @requires aptoGetAdjPostingPeriodScript
 * @requires aptoCustomerRefund
 * @requires aptoVoidTransaction
 * @requires aptoJE
 *
 * @tutorial aptoPaymentRESTLetRequest.schema
 * @tutorial aptoRESTLetResponse.schema
 */

/**
 * @summary HTTP GET Method
 *
 * @description Get outstanding balance for customer payment. Parameters are passed encoded in URL string. Well, it's only one parameter -
 * NetSuite payment id
 *
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function getRESTlet(dataIn) {

	var result;
	var restletInfo = new RESTLetInfo();

	restletInfo.logInvocation("aptoPaymentRESTLet", "get", dataIn);

	result = transactionWrapper(function(dataIn){ return getPaymentBalance(dataIn.id)}, null, dataIn);

	restletInfo.logEOE(result);

	return JSON.stringify(result);

}

/**
 * @summary HTTP POST Method (Create)
 *
 * @description Create single payment (without applying it).
 * If payment type is **Co-Broker Trust Payment** or **Write-Off**, create record in custom table.
 *
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function postRESTlet(dataIn) {

	var result = null;
	var restletInfo = new RESTLetInfo();

	restletInfo.logInvocation("aptoPaymentRESTLet", "post", dataIn);

	result = transactionWrapper(function(dataIn){ return createPayment(dataIn)}, null, dataIn);

	restletInfo.logEOE(result);


	return JSON.stringify(result);
}

/**
 * @summary HTTP PUT method (Update)
 *
 * @description Update unapplied payment.
 *
 *
 *If input data includes *isVoided* flat and it is set to *True*,
 *payment would be voided (by offsetting it with **Customer Refund** if it's regular payment, **Write Offs** and **Co-Broker Trust Payments** are persisted as records in
 *custom table, so those records would be marked inactive).
 *
 *In update mode, **Customer Refund** is created and applied to original payment and new one is created in current accounting period.
 *
 *
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function putRESTlet(dataIn) {


	var result = null;
	var restletInfo = new RESTLetInfo();

	restletInfo.logInvocation("aptoPaymentRESTLet", "put", dataIn);

	result = transactionWrapper(function(dataIn){ return updatePayment(dataIn)}, null, dataIn);

	restletInfo.logEOE(result);

	return JSON.stringify(result);
}
