/**
 * Operations with NetSuite cusomer refund transactions
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       04 Mar 2016     georgem		   Payment adjustment processing - offsetting payment with customer refund
 * @module aptoCustomerRefund
 *
 * @requires aptoSalesTransactionDefs
 * @requires aptoSalesTransactionLib
 * @requires aptoGetAdjPostingPeriodScript
 */
// testing on 10/28

/**
 * Create customer refund and offset payment
 *
 *  @param {APTOPayment} aptoPayment
 *  @param {boolean} isUnAppliedPaymentOnly - can we refund payment that has been partially applied?
 *
 */
function createCustomerRefund4payment(aptoPayment, isUnAppliedPaymentOnly)
{
	var initvalues = new Array();

	nlapiLogExecution("DEBUG", "Creating customer refund");

	if (isUnAppliedPaymentOnly == null)
		isUnAppliedPaymentOnly = true;

	var postingPeriod = getAdjPeriodForNSTransaction(RECORD_TYPE_CUST_PAYMENT, aptoPayment.paymentId); // AYPC-452
	var payment = nlapiLoadRecord(RECORD_TYPE_CUST_PAYMENT, aptoPayment.paymentId);
	nlapiLogExecution("DEBUG", "Payment loaded");
	var externalId = payment.getFieldValue("externalid");
	externalId += ".ADJ." + new Date().YYYYMMDDHHMMSS();

   if (externalId.length > 44)
	   externalId = externalId.substr(externalId.length - 44);

	initvalues.recordmode = 'dynamic';
	initvalues.entity = payment.getFieldValue("customer"); // bill to
	/** @type nlobjRecord */
	var custRefund = nlapiCreateRecord(RECORD_TYPE_CUST_REFUND, initvalues);
	nlapiLogExecution("DEBUG", "Placeholder created");


	nlapiLogExecution("DEBUG", "Copying account information from payment");
	nlapiLogExecution("DEBUG", "Previous Subsidiary on refund is: ", custRefund.getFieldValue("subsidiary"));
	//deloitte fix for ACES-588
	custRefund.setFieldValue("subsidiary", payment.getFieldValue("subsidiary"));
	nlapiLogExecution("DEBUG", "New Subsidiary on refund is: ", custRefund.getFieldValue("subsidiary"));
	custRefund.setFieldValue("account", payment.getFieldValue("account"));
	custRefund.setFieldValue("aracct", payment.getFieldValue("aracct"));
	custRefund.setFieldValue("currency", payment.getFieldValue("currency"));
	
	// custRefund.setFieldValue("subsidiary", payment.getFieldValue("subsidiary"));
	custRefund.setFieldValue("department", payment.getFieldValue("department"));
	custRefund.setFieldValue("location", payment.getFieldValue("location"));
	custRefund.setFieldValue("class", payment.getFieldValue("class"));

	custRefund.setFieldValue("postingperiod", postingPeriod.getId()); // AYPC-452

	nlapiLogExecution("DEBUG", "Telling AvidExchange not to do anything with this refund");
	custRefund.setFieldValue("custbody_pp_payment_method",AVID_PAYMENT_METHOD_DO_NOT_PROCESS); // AYPC-828
	custRefund.setFieldValue("account", payment.getFieldValue("account"));

	custRefund.setFieldValue("tranid",externalId); // setting same transaction id as payment we are offsetting

	// custRefund.setFieldValue("subsidiary", aptoPayment.accountingClassification.subsidiary);
	// custRefund.setFieldValue("department", PAYMENT_DEFAULT_DEPT);
	// custRefund.setFieldValue("location", PAYMENT_DEFAUL_MCC) // market/cost center
	// custRefund.setFieldValue("class", PAYMENT_DEFAULT_CATHEGORY);  // category

	// let's find out how many related items we have
	var itemCount = custRefund.getLineItemCount(GROUP_TYPE_APPLY);

	// I was not able to figure out how to search in subitem list
	// so I am going to access it line by line and match to info we got from APTO

	var isProceed = false;

	for (var int = 1; int <= itemCount; int++) {
	   // internal id of the invoice stored in this line
	   var internalid = custRefund.getLineItemValue(GROUP_TYPE_APPLY, "internalid", int);

	   if (internalid == aptoPayment.paymentId)
	   {
		   custRefund.selectLineItem(GROUP_TYPE_APPLY, int);
		   nlapiLogExecution("DEBUG", "Found payment we need to offset");

		   if (isUnAppliedPaymentOnly) // we can adjust only payments that has not been applied yet - let's check
		   {
			   if (custRefund.getCurrentLineItemValue(GROUP_TYPE_APPLY, "due") ==
				   custRefund.getCurrentLineItemValue(GROUP_TYPE_APPLY, "total"))
			   {
				   nlapiLogExecution("DEBUG", "Payment is not applied");
				   isProceed = true;

			   }
			   else
			   {
				   nlapiLogExecution("DEBUG", "Payment applied - cannot proceed");
				   var result = new RESTLetResult();
				   result.isSuccess = false;
				   result.errorCode = ERROR_CODE_CANNOT_ADJUST_APPLIED_PAYMENT;
				   throw result;
			   }
		   }
		   else
			   isProceed = true;

		   if (isProceed)
		   {
			   nlapiLogExecution("DEBUG", "Associating payment and refund");
			   custRefund.setCurrentLineItemValue(GROUP_TYPE_APPLY, "apply", "T");
			   custRefund.setCurrentLineItemValue(GROUP_TYPE_APPLY, "amount", custRefund.getCurrentLineItemValue(GROUP_TYPE_APPLY, "total"));

			   var recordId = nlapiSubmitRecord(custRefund);

			   nlapiLogExecution("DEBUG", "Customer refund " + recordId + " created");

			   // AvidExchange overwrites flag on record create - loading it back and setting again.
			   // hopefully in some future version it would no longer be needed.
			   // AYPC-828

			   custRefund = null;
			   custRefund = nlapiLoadRecord(RECORD_TYPE_CUST_REFUND, recordId);

			   nlapiLogExecution("DEBUG", "Telling AvidExchange not to do anything with this refund (again)");
			   custRefund.setFieldValue("custbody_pp_payment_method",AVID_PAYMENT_METHOD_DO_NOT_PROCESS);

			   try
			   {
					var custRefundId = nlapiSubmitRecord(custRefund);
			   }
			   catch (e)
			   {
				   // if we got here, customer refund was not created, so we need to fail actual edit

				   var result = new RESTLetResult();
				   result.isSuccess = false;
				   result.errorCode = ERROR_CODE_CANNON_CANNOT_CREATE_CUST_REFUND + " " + e.message.replace(/['"]+/g, '');

				   throw result;
			   }


			   nlapiLogExecution("DEBUG", "Changing payment external id");

			   nlapiLogExecution("DEBUG", "External ID " + externalId);

			   // reloading payment - it was changed
			   payment = nlapiLoadRecord(RECORD_TYPE_CUST_PAYMENT, aptoPayment.paymentId);
			   payment.setFieldValue("tranid", externalId);
			   payment.setFieldValue("externalid", externalId);

			   nlapiSubmitRecord(payment);
		   }

		   break;
	   }
	}

	if (!isProceed)
	{
		var e = new RESTLetResult();

		e.errorCode = ERROR_CODE_CANNOT_FIND_TRANSACTIONS_TO_ADJUST;

		throw e;
	}
	nlapiLogExecution("DEBUG", "done");

}
