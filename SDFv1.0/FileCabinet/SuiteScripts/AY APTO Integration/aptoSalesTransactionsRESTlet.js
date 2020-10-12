/**
 * @summary Batch-mode requests to process Apto Brokerage Transaction API end point
 * @description <b>Not in use right now, should be removed if it would never be implemented in Apto</b>
 *
 *
 * Version    Date            Author           Remarks
 *
 * 1.0       18 Jan 2016     georgem
 *
 * 1.1		 16 Feb 2016     georgem			adding put and delete methods
 *
 * @todo Evaluate if it needs to be removed
 * @module aptoSalesTransactionsRESTLet
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
 * @tutorial aptoSalesTransactionsRESTLetRequest.schema
 * @tutorial aptoRESTLetResponse.schema
 */

/**
 * Create APTO sales objects in batch mode (milestone processing)
 *
 * @param {APTOSalesBatch} dataIn  Parameter object - batch of transactions
 *
 * @returns {RESTLetResult} array of Output object - results of operation
 */
function postRESTlet(dataIn) {
	nlapiLogExecution("DEBUG", "Starting post RESTLet (batch mode)");
	var results = new Array();
	nlapiLogExecution("DEBUG",JSON.stringify(dataIn));

	var aptoTransactions = dataIn.batch;
	var failOnError = dataIn.failOnError;

	if (failOnError)
		nlapiLogExecution("DEBUG","This batch would stop at the first error");

	if (Array.isArray(aptoTransactions))
	{
		for (var int = 0; int < aptoTransactions.length; int++) {
			var result = processOneSalesTransaction(aptoTransactions[int]);

			results.push(result);

			if (failOnError && ! result.isSuccess)
			{
				break;
			}

		}
	}
	else
	{
		nlapiLogExecution( 'DEBUG', "This API call expects to receive array of transactions to process");
		var result = new RESTLetResult();
		result.errorCode = ERROR_CODE_ARRAY_EXPECTED;
		results.push(result);

	}


	nlapiLogExecution("DEBUG",JSON.stringify(results));

	nlapiLogExecution("DEBUG", "RESTLet (batch mode) done");

	return JSON.stringify(results);
}

/**
 * Update APTO sales objects in batch mode (milestone processing)
 *
 * @param {APTOSalesBatch} dataIn  Parameter object - batch of transactions
 *
 * @returns {RESTLetResult} array of Output object - results of operation
 */
function putRESTlet(dataIn) {
	nlapiLogExecution("DEBUG", "Starting post RESTLet (batch mode)");
	var results = new Array();
	nlapiLogExecution("DEBUG",JSON.stringify(dataIn));

	var aptoTransactions = dataIn.batch;
	var failOnError = dataIn.failOnError;

	if (failOnError)
		nlapiLogExecution("DEBUG","This batch would stop at the first error");

	if (Array.isArray(aptoTransactions))
	{
		for (var int = 0; int < aptoTransactions.length; int++) {
			var result = processOneSalesTransaction(aptoTransactions[int]);

			results.push(result);

			if (failOnError && ! result.isSuccess)
			{
				break;
			}

		}
	}
	else
	{
		nlapiLogExecution( 'DEBUG', "This API call expects to receive array of transactions to process");
		var result = new RESTLetResult();
		result.errorCode = ERROR_CODE_ARRAY_EXPECTED;
		results.push(result);

	}


	nlapiLogExecution("DEBUG",JSON.stringify(results));

	nlapiLogExecution("DEBUG", "RESTLet (batch mode) done");

	return JSON.stringify(results);
}

/**
 * Void APTO sales objects in batch mode (milestone processing)
 *
 * @param {APTOSalesBatch} dataIn  Parameter object - batch of transactions
 *
 * @returns {RESTLetResult} array of Output object - results of operation
 */
function deleteRESTlet(dataIn) {
	nlapiLogExecution("DEBUG", "Starting post RESTLet (batch mode)");
	var results = new Array();
	nlapiLogExecution("DEBUG",JSON.stringify(dataIn));

	var aptoTransactions = dataIn.batch;
	var failOnError = dataIn.failOnError;

	if (failOnError)
		nlapiLogExecution("DEBUG","This batch would stop at the first error");

	if (Array.isArray(aptoTransactions))
	{
		for (var int = 0; int < aptoTransactions.length; int++) {
			/** @type RESTLetResult **/
			var result = voidOneSalesTransaction(aptoTransactions[int]);

			results.push(result);

			if (failOnError && ! result.isSuccess)
			{
				break;
			}

		}
	}
	else
	{
		nlapiLogExecution( 'DEBUG', "This API call expects to receive array of transactions to process");
		var result = new RESTLetResult();
		result.errorCode = ERROR_CODE_ARRAY_EXPECTED;
		results.push(result);

	}


	nlapiLogExecution("DEBUG",JSON.stringify(results));

	nlapiLogExecution("DEBUG", "RESTLet (batch mode) done");

	return JSON.stringify(results);
}