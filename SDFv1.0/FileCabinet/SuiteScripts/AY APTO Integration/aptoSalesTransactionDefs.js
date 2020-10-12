/**
 * Constants and classes definitions
 *
 * Version    Date            Author           Remarks
 *
 *  1.00       06 Jan 2016     georgem		   Putting definitions into separate file
 *
 * 1.1		  14 Jul 2016     georgem		   Modified IDs for Pilot instance of NetSuite
 *
 * 1.2		  14 Dec 2016     georgem          co-broker trust payment processings
 *
 * @module aptoSalesTransactionDefs
 */

 /** @type {string} */
 const INVOICE_TYPE_UNBILLED_UNEARNED = "3";
 /** @type {string} */
const INVOICE_TYPE_UNBILLED_EARNED = "2";
 /** @type {string} */
const INVOICE_TYPE_BILLED_EARNED = "1";

// pilot
// const INVOICE_CUSTOM_FORM_BILL_TO_INVOICE_ID = "102";
// const INVOICE_CUSTOM_FORM_BILL_TO_INVOICE_ALLOCATIONS_ID = "124";

// dev
 /** @type {string} */
const INVOICE_CUSTOM_FORM_BILL_TO_INVOICE_ID = "102";
 /** @type {string} */
const INVOICE_CUSTOM_FORM_BILL_TO_INVOICE_ALLOCATIONS_ID = "124";

 /** @type {string} */
const RECORD_TYPE_ACCOUNT = "account";
 /** @type {string} */
const RECORD_TYPE_ACCOUNTING_PERIOD = "accountingperiod";
 /** @type {string} */
const RECORD_TYPE_CLASSIFICATION = "classification";
 /** @type {string} */
const RECORD_TYPE_CURRENCY = "currency";
 /** @type {string} */
const RECORD_TYPE_CUSTOMER = "customer";
 /** @type {string} */
const RECORD_TYPE_DEPARTMENT = "department";
 /** @type {string} */
const RECORD_TYPE_EMPLOYEE = "employee";
 /** @type {string} */
const RECORD_TYPE_INVOICE = "invoice";
 /** @type {string} */
const RECORD_TYPE_LOCATION = "location";
 /** @type {string} */
const RECORD_TYPE_NONINVENTORYSALEITEM = "nonInventorySaleItem";
 /** @type {string} */
const RECORD_TYPE_SUBSIDIARY = "subsidiary";
 /** @type {string} */
const RECORD_TYPE_TERM = "term";
 /** @type {string} */
const RECORD_TYPE_CLIENT = "custbody_client";
 /** @type {string} */
const RECORD_TYPE_DEAL = "custbody_deal";
 /** @type {string} */
const RECORD_TYPE_CREDIT_MEMO = "creditmemo";
 /** @type {string} */
const RECORD_TYEP_CUSTOMER_REFUND = "customerrefund";
 /** @type {string} */
const RECORD_TYPE_JOURNAL_ENTRY = "journalentry";
 /** @type {string} */
const RECORD_TYPE_INETRCOMPANY_JOURNAL_ENTRY = "intercompanyjournalentry";
 /** @type {string} */
const RECORD_TYPE_ADV_INETRCOMPANY_JOURNAL_ENTRY = "advintercompanyjournalentry";
 /** @type {string} */
const RECORD_TYPE_CUST_PAYMENT = "customerpayment";
 /** @type {string} */
const RECORD_TYPE_CUST_REFUND = "customerrefund";

// NetSuite 2018.2 and up
 /** @type {string} */
const RECORD_TYPE_CUST_SUB_RELATION = "customersubsidiaryrelationship";
 /** @type {string} */
const RECORD_TYPE_VENDOR_SUB_RELATION = "vendorsubsidiaryrelationship";

 /** @type {string} */
const CUST_RECORD_TYPE_TRUST_COBROKER_PAYMENT = "customrecord_ay_trust_co_broker_payment";
 /** @type {string} */
const CUST_RECORD_TYPE_BAD_DEPT_WRITE_OFF = "customrecorday_bad_debt_write_off";

 /** @type {string} */
const GROUP_TYPE_ITEM = "item";
 /** @type {string} */
const GROUP_TYPE_LINE = "line";
 /** @type {string} */
const GROUP_TYPE_APPLY = "apply";
 /** @type {string} */
const GROUP_TYPE_LINKS = "links";
 /** @type {string} */
const GROUP_TYPE_CREDIT = "credit";

 /** @type {string} */
const TAX_GROUP_CANADA_NO_TAXES = "14"; // VERIFY IN PRODUCTION !!!

 /** @type {string} */
const ACCOUNT_REC_UNBILLED_UNEARNED = "1076"; // 12100-150
 /** @type {string} */
const ACCOUNT_REC_UNBILLED_EARNED = "1075";   // 12100-100
 /** @type {string} */
const ACCOUNT_REC_BILLED_EARNED = "126";      // 12100-000

 /** @type {string} */
const ACCOUNT_REV_UNBILLED_UNEARNED = "311";    // 22100-150
 /** @type {string} */
const ACCOUNT_BAD_DEBT_WRITE_OFFS = "491";  // 59000-100
 /** @type {string} */
const ACCOUNT_ZBA_BAD_DEBT_WRITE_OFF_EXPENSE = "1118"; // 69000-110

 /** @type {string} */
const ACCOUNT_CO_BROKER_COMMS_PAYABLE = "277"; // 21230-000
 /** @type {string} */
const ACCOUNT_BROKERAGE_COMMS_RECEIVABLE = '126'; // 12100-000
 /** @type {string} */
const ACCOUNT_TRUST_LIABILITY = '277'; // 21230-000

 /** @type {string} */
const ACCOUNT_GST_HST_ON_SALE = '111'; // 21400-000
 /** @type {string} */
const ACCOUNT_QST_ON_SALE = '180'; // 21450-000

 /** @type {string} */
const ITEM_REVENUE_CLEARING = "REVENUE_CLEARING";
 /** @type {string} */
const ITEM_UNBILLED_UNEARNED_REVENUE = "UNBILLED_UNEARNED_REVENUE";
 /** @type {string} */
const ITEM_AY_OTTE_RECOVERY = "AY_OTTE_RECOVERY";
 /** @type {string} */
const ITEM_CONSULTING = "CONSULTING";
 /** @type {string} */
const ITEM_LEASE_INDUSTRIAL = "LEASE_INDUSTRIAL";
 /** @type {string} */
const ITEM_LEASE_OFFICE = "LEASE_OFFICE";
 /** @type {string} */
const ITEM_LEASE_OTHER = "LEASE_OTHER";
 /** @type {string} */
const ITEM_LEASE_RETAIL = "LEASE_RETAIL";
 /** @type {string} */
const ITEM_SALE_INDUSTRIAL = "SALE_INDUSTRIAL";
 /** @type {string} */
const ITEM_SALE_LAND = "SALE_LAND";
 /** @type {string} */
const ITEM_SALE_MULTI_RESIDENTIAL = "SALE_MULTI_RESIDENTIAL";
 /** @type {string} */
const ITEM_SALE_OFFICE = "SALE_OFFICE";
 /** @type {string} */
const ITEM_SALE_OTHER = "SALE_OTHER";
 /** @type {string} */
const ITEM_SALE_RETAIL = "SALE_RETAIL";
 /** @type {string} */
const ITEM_SHARED_OTTE_RECOVERY = "SHARED_OTTE_RECOVERY";
 /** @type {string} */
const ITEM_VALUATION_APPRAISAL = "VALUATION_APPRAISAL";
 /** @type {string} */
const ITEM_REFERRAL = "REFERRAL";
 /** @type {string} */
const ITEM_MORTGAGE_FINANCE = "MORTGAGE_FINANCE";
// Depricated. USE @see ITEM_CM_DEPT_EQUITY instead
 /**
  * @type {string}
  * @deprecated
  */
const ITEM_FINANCE = "FINANCE";
 /** @type {string} */
const ITEM_CM_DEBT_EQUITY =  "CM_DEBT_EQUITY";

 /** @type {string} */
const CURRENCY_USD = "USD";
 /** @type {string} */
const CURRENCY_CAD = "CAD";
 /** @type {string} */
const CURRENCY_EUR = "EUR";
 /** @type {string} */
const CURRENCY_GBP = "GBP";
 /** @type {string} */
const CURRENCY_MXN = "MXN";

 /** @type {string} */
const CURRENCY_CAD_CODE = "1";

 /** @type {string} */
const TERM_DUE_ON_RECEIPT = "DUE_ON_RECEIPT";
 /** @type {string} */
const TERM_NET_15 = "NET_15";
 /** @type {string} */
const TERM_NET_30 = "NET_30";

 /** @type {string} */
const ERROR_CODE_JSON_EMPTY = "RESTLET_JSON_EMPTY";
 /** @type {string} */
const ERROR_CODE_INVALID_STRUCTURE = "RESTLET_INVALID_JSON_STRUCTURE";
 /** @type {string} */
const ERROR_CODE_MISSING_INVOICE_LINES = "RESTLET_MISSING_INVOICE_LINES";
 /** @type {string} */
const ERROR_CODE_CANNOT_FIND_HRISID = "RESTLET_CANNOT_FIND_HRIS_ID";
 /** @type {string} */
const ERROR_CODE_CANNOT_FIND_POSTING_PERIOD = "RESTLET_CANNOT_FIND_POSTING_PERIOD";
 /** @type {string} */
const ERROR_CODE_CANNOT_FIND_DEAL_ID = "RESTLET_CANNOT_FIND_DEAL_ID";
 /** @type {string} */
const ERROR_CODE_INCORRECT_INVOICE_TYPE = "RESTLET_INCORRECT_INVOICE_TYPE";
 /** @type {string} */
const ERROR_CODE_MISSING_INVOICE = "RESTLET_MISSING_INVOICE";
 /** @type {string} */
const ERROR_CODE_MISSING_FIELD = "REST_MISSING_MANDATORY_FIELD_";
 /** @type {string} */
const ERROR_CODE_ROLLBACK_ERROR = "RESTLET_ROLLBACK_ERROR";
 /** @type {string} */
const ERROR_CODE_CANNOT_FIND_PAYMENT = "RESTLET_CANNOT_FIND_PAYMENT";
 /** @type {string} */
const ERROR_CODE_ERROR_PROCESSING_PAYMENT = "RESTLET_CANNOT_PROCESS_PAYMENT_";
 /** @type {string} */
const ERROR_CODE_ARRAY_EXPECTED = "RESTLET_ARRAY_EXPECTED";
 /** @type {string} */
const ERROR_CODE_DEPOSIT_ACCT_NOT_CONFIGURED = "RESTLET_DEPOSIT_ACCT_NOT_CONFIGURED";
 /** @type {string} */
const ERROR_CODE_CANNOT_FIND_TRANSACTIONS_TO_VOID = "RESTLET_CANNOT_FIND_TRANSACTIONS_TO_VOID";
 /** @type {string} */
const ERROR_CODE_CANNOT_FIND_TRANSACTIONS_TO_ADJUST = "RESTLET_CANNOT_FIND_TRANSACTIONS_TO_ADJUST";
 /** @type {string} */
const ERROR_CODE_CANNOT_ADJUST_APPLIED_PAYMENT = "RESTLET_CANNOT_ADJUST_APPLIED_PAYMENT";
 /** @type {string} */
const ERROR_CODE_PAYMENT_HAS_NO_APPLICATIONS = "RESTLET_PAYMENT_HAS_NO_INVOICES_APPLY_TO";
 /** @type {string} */
const ERROR_CODE_CANNOT_FIND_INVOICES_TO_PAY = "RESTLET_CANNOT_FIND_INVOICES_TO_PAY";
 /** @type {string} */
const ERROR_CODE_CANNOT_UPDATE_VENDOR_INFO = "RESTLET_ERROR_CODE_CANNOT_UPDATE_VENDOR_INFO";
 /** @type {string} */
const ERROR_CODE_CANNON_VOID_CO_BROKER_CHECK_PAYMENT = "RESTLET_CODE_CANNON_VOID_CO_BROKER_CHECK_PAYMENT";
 /** @type {string} */
const ERROR_CODE_CANNON_CANNOT_CREATE_CUST_REFUND = "RESTLET_ERROR_CODE_CANNOT_CREATE_CUST_REFUND";
 /** @type {string} */
const ERROR_CODE_JE_ID_MISSING = "RESTLET_ERROR_CODE_JE_ID_MISSING";
 /** @type {string} */
const ERROR_CODE_CANNOT_VOID_SELECTED_TRANS_TYPE = "RESTLET_CANNOT_VOID_SELECTED_TRANS_TYPE";

 /** @type {string} */
const TAX_CODE_GST_CA_0 = "GST CA_0";   // "6"
 /** @type {string} */
const TAX_CODE_GST_CA_5 = "GST CA_5";   // "5"
 /** @type {string} */
const TAX_CODE_HST_ON_13 = "HST ON_13"; // "620"
 /** @type {string} */
const TAX_CODE_PST_CA_0 = "PST CA_0";   // "623"
 /** @type {string} */
const TAX_CODE_PST_ON_0 = "PST_ON_0";   // "9"
 /** @type {string} */
const TAX_CODE_QST_QC_9_975  = "QST QC_9.975"; // "60"
 /** @type {string} */
const TAX_CODE_PST_BC_7 = "PST_BC_7"; // 54
 /** @type {string} */
const TAX_CODE_GST_QST_QC_14_975 = "GST_QST_QC_14_975"; // 624
 /** @type {string} */
const TAX_CODE_HST_NS_15 = "HST_NS_15"; // 683 prod
 /** @type {string} */
 const TAX_CODE_GST_HST_MEALS_ENT = "GST/HST Meals & Entertainment";
 /** @type {string} */
 const TAX_CODE_QST_MEALS_ENT = "QST Meals and Entertainment";
 /** @type {string} */
 const TAX_CODE_HST_MEALS_ENT = "HST Meals & Entert - 5.5%";


 /** @type {string} */
const TAX_CONTROL_ACCOUNT_GST_HST_ON_PURCHASE = "109"; //	21430-000
 /** @type {string} */
const TAX_CONTROL_ACCOUNT_PST_PAYABLE_ON_PURCHASE = "1364"; //	21444-000
 /** @type {string} */
const TAX_CONTROL_ACCOUNT_QST_ON_PURCHASE_QC = "1064"; //	21460-000
 /** @type {string} */
const TAX_CONTROL_ACCOUNT_PST_EXPENSES_BC = "1366";     // 21450-200
/** @type {string} */
const TAX_CONTROL_ACCOUNT_GST_HST_MEALS_ENT = "1078"; //	21442-000
/** @type {string} */
const TAX_CONTROL_ACCOUNT_QST_MEALS_ENT = "1064"; //	21460-000


 /** @type {string} */
const JE_LINE_ITEM_MEMO_TAX_LIABILITY = "Co-Broker/Fee Share Tax Liability";
 /** @type {string} */
const DATE_MASK = "MM/DD/YYYY";

 /** @type {string} */
const PAYMENT_METHOD_AMERICAN_EXPRESS = "AMERICAN_EXPRESS";
 /** @type {string} */
const PAYMENT_METHOD_CASH = "CASH";
 /** @type {string} */
const PAYMENT_METHOD_CHEQUE	= "CHEQUE";
 /** @type {string} */
const PAYMENT_METHOD_DISCOVER = "DISCOVER";
 /** @type {string} */
const PAYMENT_METHOD_EFT = "EFT";
 /** @type {string} */
const PAYMENT_METHOD_MASTER_CARD = "MASTER_CARD";
 /** @type {string} */
const PAYMENT_METHOD_VISA = "VISA";
 /** @type {string} */
const PAYMENT_METHOD_CO_BROKER_TRUST_CHECK = "CO-BROKER_TRUST";
 /** @type {string} */
const PAYMENT_METHOD_WRITE_OFF ="WRITE-OFF";

// default accounting classification for cash receipts
 /** @type {string} */
const PAYMENT_DEFAULT_DEPT = "19";
 /** @type {string} */
const PAYMENT_DEFAUL_MCC = "100";
 /** @type {string} */
const PAYMENT_DEFAULT_CATHEGORY = "1";

/**
 * Backwards compatability - APTO expects payment ID to be return,
 * Yet I have 2 different tables where this data is stored. Theoretically IDs would never match,
 * but I do not want to take a chance
 */
 /** @type {string} */
const PAYMENT_PREFIX_COBROKER_CHECK = "CBTPR";
 /** @type {string} */
const PAYMENT_PREFIX_WRITE_OFF = "WO";

// credit memo types
 /** @type {string} */
const CM_ADJUSTMENT = "0";
 /** @type {string} */
const CM_MILESTONE = "1";
 /** @type {string} */
const CM_VOID = "2";
 /** @type {string} */
const CM_INTEGRATION_OTHER = "110";
 /** @type {string} */

// AvidExchange Constants
 /** @type {string} */
const AVID_PAYMENT_METHOD_DO_NOT_PROCESS = "4";

 /** @type {string} */
const ENTITY_SEARCH_TYPE_VENDOR = "vendor";
 /** @type {string} */
const ENTITY_SEARCH_TYPE_BILL_TO = "billto";

/**
 * @class
 */
CMMemos = function()
{
	this.hashMap = {};
	this.loadHash = function()
	{
		this.hashMap[CM_ADJUSTMENT] = "APTO Adjustment";
		this.hashMap[CM_MILESTONE] = "APTO Invoice Milestone Processing";
		this.hashMap[CM_VOID] = "APTO Invoice Voided";
		this.hashMap[CM_INTEGRATION_OTHER] = "Created by APTO Integration";
	};

	this.getValue = function(id)
	{
		return this.hashMap[id];
	};

	this.getValues = function()
	{
		var values = [];
		var keys = Object.keys(this.hashMap);
		for (var int = 0; int < keys.length; int++) {
			values.push(this.hashMap[keys[int]]);
		}
		return values;
	};

	this.loadHash();
}
/**
 * Customer payment types
 * @class
 */
PaymentMethods = function()
{
	this.hashMap = {};
	this.loadHash = function()
	{
		this.hashMap[PAYMENT_METHOD_AMERICAN_EXPRESS]  = 6;
		this.hashMap[PAYMENT_METHOD_CASH]  = 1;
		this.hashMap[PAYMENT_METHOD_CHEQUE]  = 2;
		this.hashMap[PAYMENT_METHOD_CO_BROKER_TRUST_CHECK]  = 2;
		this.hashMap[PAYMENT_METHOD_WRITE_OFF] = 2;
		this.hashMap[PAYMENT_METHOD_DISCOVER]  = 3;
		this.hashMap[PAYMENT_METHOD_EFT]  = 7;
		this.hashMap[PAYMENT_METHOD_MASTER_CARD]  = 4;
		this.hashMap[PAYMENT_METHOD_VISA]  = 5;

	};
	this.getValue = function(id)
	{
		return this.hashMap[id];
	};


	this.loadHash();
}
/**
 * Mapping of tax codes into tax control accounts
 * @class
 */
TaxControlAccounts = function()
{
	this.hashMap = {};
	this.loadHash = function()
	{
		this.hashMap[TAX_CODE_GST_CA_0] = TAX_CONTROL_ACCOUNT_GST_HST_ON_PURCHASE;
		this.hashMap[TAX_CODE_GST_CA_5] = TAX_CONTROL_ACCOUNT_GST_HST_ON_PURCHASE;
		this.hashMap[TAX_CODE_HST_ON_13] = TAX_CONTROL_ACCOUNT_GST_HST_ON_PURCHASE;
		this.hashMap[TAX_CODE_PST_CA_0] = TAX_CONTROL_ACCOUNT_PST_PAYABLE_ON_PURCHASE;
		this.hashMap[TAX_CODE_PST_ON_0] = TAX_CONTROL_ACCOUNT_PST_PAYABLE_ON_PURCHASE;
		this.hashMap[TAX_CODE_PST_BC_7] = TAX_CONTROL_ACCOUNT_PST_EXPENSES_BC;
		this.hashMap[TAX_CODE_QST_QC_9_975] = TAX_CONTROL_ACCOUNT_QST_ON_PURCHASE_QC;
		this.hashMap[TAX_CODE_GST_QST_QC_14_975] = TAX_CONTROL_ACCOUNT_QST_ON_PURCHASE_QC;
		this.hashMap[TAX_CODE_HST_NS_15] = TAX_CONTROL_ACCOUNT_GST_HST_ON_PURCHASE;
		this.hashMap[TAX_CODE_GST_HST_MEALS_ENT] = TAX_CONTROL_ACCOUNT_GST_HST_MEALS_ENT;
		this.hashMap[TAX_CODE_QST_MEALS_ENT] = TAX_CONTROL_ACCOUNT_QST_MEALS_ENT;
		this.hashMap[TAX_CODE_HST_MEALS_ENT] = TAX_CONTROL_ACCOUNT_GST_HST_MEALS_ENT; //uses the same account as GST/HST Meals & Entertainment
	};
	this.getValue = function(id)
	{
		return this.hashMap[id];
	};

	this.loadHash();
}

/**
 * Tax code into internal ID translation
 * @class
 */
TaxCodes = function()
{
	this.hashMap = {};
	this.loadHash = function()
	{
		this.hashMap[TAX_CODE_GST_CA_0] = "6";
		this.hashMap[TAX_CODE_GST_CA_5] = "5";
		this.hashMap[TAX_CODE_HST_ON_13] = "620"
		this.hashMap[TAX_CODE_PST_CA_0] = "623";
		this.hashMap[TAX_CODE_PST_ON_0] = "9";
		this.hashMap[TAX_CODE_PST_BC_7] = "54";
		this.hashMap[TAX_CODE_QST_QC_9_975] = "60";
		this.hashMap[TAX_CODE_GST_QST_QC_14_975] = "624";
		this.hashMap[TAX_CODE_HST_NS_15] = "683"

	};

	this.getValue = function(id)
	{
		return this.hashMap[id];
	};

	this.loadHash();
}
/**
 * Invoice type into receivable account # mapping
 * @class
 */
AccountRecAccounts = function()
{
	this.hashMap = {};
	this.loadHash = function()
	{
		this.hashMap[INVOICE_TYPE_UNBILLED_UNEARNED] = ACCOUNT_REC_UNBILLED_UNEARNED;
		this.hashMap[INVOICE_TYPE_UNBILLED_EARNED] = ACCOUNT_REC_UNBILLED_EARNED;
		this.hashMap[INVOICE_TYPE_BILLED_EARNED] = ACCOUNT_REC_BILLED_EARNED;
	};
	this.getValue = function(id)
	{
		return this.hashMap[id];
	};

	this.loadHash();
}
/**
 * Mapping invoice terms into internal codes
 * @class
 */
InvoiceTerms = function()
{

	this.hashMap = {};
	this.offsetMap = {};

	this.loadHash = function()
	{
		this.hashMap[TERM_DUE_ON_RECEIPT] = "4";
		this.offsetMap[TERM_DUE_ON_RECEIPT] = 0;

		this.hashMap[TERM_NET_15] = "1";
		this.offsetMap[TERM_NET_15] = 1296000000;
		this.hashMap[TERM_NET_30] = "2";
		this.offsetMap[TERM_NET_30] = 2592000000;

	};
	this.getValue = function(id)
	{
		return this.hashMap[id];
	};

	this.getOffset = function(id)
	{
		return this.offsetMap[id];
	};

	this.loadHash();
}

/**
 * Mapping currencies into internal codes
 * @class
 */
CurrencyMap = function()
{
	this.hashMap = {};
	this.loadHash();
}
CurrencyMap.prototype.loadHash = function()
{
	this.hashMap[CURRENCY_USD] = "2";
	this.hashMap[CURRENCY_CAD] = "1";
	this.hashMap[CURRENCY_EUR] = "4";
	this.hashMap[CURRENCY_GBP] = "3";
	this.hashMap[CURRENCY_MXN] = "5";

}
CurrencyMap.prototype.getValue = function(id)
{
	return this.hashMap[id];
}
CurrencyMap.prototype.getKey = function(value)
{
	for (var key in this.hashMap)
	{
	   if (this.hashMap[key] == value)
	      return key;
	}

	return null;
}

/**
 * Item master hash table wrapper
 * will be used by invoice creation - APTO will pass line item type and I will convert it into actual internal ID of the item
  *@class
 */
ItemMaster = function()
{
	this.hashMap = {};
	this.loadHash();
}

/**
 * Load hash table with values from NetSuite setup
 */
ItemMaster.prototype.loadHash = function()
{
	this.hashMap[ITEM_REVENUE_CLEARING] = "635";
	this.hashMap[ITEM_UNBILLED_UNEARNED_REVENUE] = "634";
	this.hashMap[ITEM_AY_OTTE_RECOVERY] = "636";
	this.hashMap[ITEM_CONSULTING] = "611"; //ACES-627 DELOITTE FIX
	this.hashMap[ITEM_LEASE_INDUSTRIAL] = "609";
	this.hashMap[ITEM_LEASE_OFFICE] = "608";
	this.hashMap[ITEM_LEASE_OTHER] = "611";
	this.hashMap[ITEM_LEASE_RETAIL] = "610";
	this.hashMap[ITEM_SALE_INDUSTRIAL] = "615";
	this.hashMap[ITEM_SALE_LAND] = "617";
	this.hashMap[ITEM_SALE_MULTI_RESIDENTIAL] = "619";
	this.hashMap[ITEM_SALE_OFFICE] = "614";
	this.hashMap[ITEM_SALE_OTHER] = "618";
	this.hashMap[ITEM_SALE_RETAIL] = "616";
	this.hashMap[ITEM_SHARED_OTTE_RECOVERY] = "637";
	this.hashMap[ITEM_VALUATION_APPRAISAL] = "613";
	this.hashMap[ITEM_REFERRAL] = "611"; //ACES-627 DELOITTE FIX
	this.hashMap[ITEM_MORTGAGE_FINANCE] = "645";
	this.hashMap[ITEM_FINANCE] = "643";
	this.hashMap[ITEM_CM_DEBT_EQUITY] = "643";
};

ItemMaster.prototype.getValue = function(id)
{
	return this.hashMap[id];
}

/**
 * NetSuite accounting classification of journal entry or other entity
 * @class
 */
AccountingClassification = function()
{
	/**
	 * NS internal id of subsidiary
	 */
	this.subsidiary = "";
	/**
	 * NS internal id of department
	 */
	this.department = "";
	/**
	 * NS internal id of market/cost center
	 */
	this.market = "",
	/**
	 * NS internal id of accounting category
	 */
	this.category = "";

	this.populateFromNSRecord = function(record)
	{
		this.subsidiary = record.getFieldValue("subsidiary");
		this.department = record.getFieldValue("department");
		this.market = record.getFieldValue("location");
		this.category = record.getFieldValue("class");
	};

	this.populateFromNSInvoice = function(invoiceId)
	{

		var fields = ["subsidiary", "department", "location", "class"];
		var columns = nlapiLookupField(RECORD_TYPE_INVOICE, invoiceId, fields);

		this.subsidiary = columns.subsidiary;
		this.department = columns.department;
		this.market = columns.location;
		this.category = columns["class"];
	}
};
/**
 * Single line of the accounting invoice
 * @returns {APTOInvoiceLine}
 * @class
 */
APTOInvoiceLine = function()
{
	/**
	 * Non-inventory item we are selling. @see ITEM_ constants for valid values
	 */
	this.item = "";
	/**
	 * 4 required NS fields @see AccountingClassification
	 * {AccountingClassification} accountingClassification
	 */
	this.accountingClassification = new AccountingClassification();
	/**
	 * Optional notes for invoice line
	 */
	this.notes = "";
	/**
	 * Invoice lime amount
	 */
	this.amount = 0;
	/**
	 * NetSuite overwrites this value, but we might need to use in the future if we are goign to have
	 * discrepancies between APTO and NS
	 */
	this.taxAmount = 0;
	/**
	 * Tax group used for Canadian tax calculations
	 */
	this.taxGroup = "";

	/**
	 * Placeholder - do not use.
	 */
	this.taxRate1 = 0;

	/**
	 * Placeholder - do not use.
	 */
	this.taxRate2 = 0;


};

/**
 * Inbound data - invoice data coming from APTO
 * @returns {APTOInvoice}
 * @class
 */
APTOInvoice = function()
{
	/**
	 * APTO invoice number - NS invoice would have same number
	 */
	this.invoiceNo = "";
	/**
	 * Transaction ID - must be unique. Secondary identifier for the invoice.
	 */
	this.transactionId = "";

	/**
	 * Invoice Type, please @see INVOICE_TYPE_ constants for valid values
	 */
	this.invoiceType = "";

	/**
	 * DEAL ID this invoice is associated with (expected APTO deal id in the format "XXXX-XXXX"
	 */
	this.dealId = "";

	/**
	 * Currency for this invoice. @see CURRENCY_ constants for valid values
	 */
	this.currency = "";

	/**
	 * Internal ID of NetSuite BILL_TO (customer)
	 */
	this.billTo = "";

	/**
	 * Internal ID of NetSuite client
	 */
	this.client = "";

	/**
	 * HRIS ID of primary broker on this transaction
	 */
	this.primaryBrokerId = "";

	/**
	 * Invoice date in milliseconds since 1970.
	 */
	this.invoiceDateInMillis = 0;
	/**
	 * Transaction date in milliseconds since 1970 (used to define accounting period this invoice belongs to)
	 */
	this.transactionDateInMillis = 0;

	/**
	 * Original transaciton date in milliseconds
	 */
	this.aptoTransactionDateInMillis = 0;
	/**
	 * Invoice terms. @see TERM_ constants for valid values
	 */
	this.terms = "";

	/**
	 * 4 required NS fields @see AccountingClassification
	 * {AccountingClassification} accountingClassification
	 */
	this.accountingClassification = new AccountingClassification();

	/**
	 * Invoice Lines. Array should not be empty for processing to work. @see APTOInvoiceLine for structure
	 * {APTOInvoiceLine} lines
	 */
	this.lines = new Array();

};


/**
 * Class defining fields needed to create journal entry
 * @class
 */
NSJournalEntry = function()
{
	/**
	 * JE header - subsidiary
	 */
	this.subsidiary = ""; // only subsidiary goes into header

	/**
	 * Posting period this JE should be posted into (internal ID)
	 */
	this.postingPeriod = "";

	/**
	 * Transaction date (in millis from 1970)
	 */
	this.tranDate = "";

	/**
	 *  Currency used for this JE. @see CURRENCY_ constants for valid values
	 */
	this.currency = "";

	/**
	 * APTO invoice number. Would be used to populate JE tranId and custom field "APTO Invoice"
	 */
	this.aptoInvoice = "";

	/**
	 * Array of @see NSJELine
	 */
	this.lines = new Array();

	/**
	 * Apto payment number. Would be used to populate JE trandId, if JE is used for payment processing (custom payment types)
	 */
	this.aptoPaymentNumber = "";

	/**
	 * Since JS does not allow multiple constructors, creating populate function
	 * @param {APTOTransaction} aptoSalesTransaction
	 */
	this.populateFromSalesTransaction = function(aptoSalesTransaction)
	{
		// header information is populated from invoice

		this.subsidiary = aptoSalesTransaction.invoice.accountingClassification.subsidiary;

		this.postingPeriod = aptoSalesTransaction.invoice.accountingPeriodId;

		//DELOITTE FIX JIRA 309 -- TRANSACTION DATE FIX
		var enddate = new Date(nlapiLookupField('accountingperiod', aptoSalesTransaction.invoice.accountingPeriodId, 'enddate'));
		this.tranDate = nlapiDateToString(calculateCorrectTransDate(dateInMillis2date(aptoSalesTransaction.invoice.transactionDateInMillis),
						aptoSalesTransaction.invoice.processingDateInMillis?dateInMillis2date(aptoSalesTransaction.invoice.processingDateInMillis):null,
						dateInMillis2date(enddate.getTime())), DATE_MASK);

		var currencyMap = new CurrencyMap();
		this.currency = currencyMap.getValue(aptoSalesTransaction.invoice.currency);

		this.aptoInvoice = aptoSalesTransaction.invoice.invoiceNo;

		var taxControlAccounts = new TaxControlAccounts();

		nlapiLogExecution("DEBUG", aptoSalesTransaction.thirdPartyTaxes.length + " participant(s) found");

		// line items are created from 3rd party tax data
		for (var int = 0; int < aptoSalesTransaction.thirdPartyTaxes.length; int++) {
			/**
			 * One 3rd party participant to this transaction
			 */
			taxParticipant = aptoSalesTransaction.thirdPartyTaxes[int];

			var crAmt = 0; // need to calculate credit amount for all debit records we are about to create

			nlapiLogExecution("DEBUG", taxParticipant.taxes.length + " tax codes");

			// now we need to look at every tax amount (and tax code) associated with this party
			for (var i = 0; i < taxParticipant.taxes.length; i++) {
				var tax = taxParticipant.taxes[i];

				var jeLine = new NSJELine();

				jeLine.vendorId = taxParticipant.vendorId;

				if (taxParticipant.hasOwnProperty("aptoVendorId")) // backwards compatability
					jeLine.aptoVendorId = taxParticipant.aptoVendorId;


				jeLine.clientId = aptoSalesTransaction.invoice.client;

				jeLine.setAccountingClassification(aptoSalesTransaction.invoice.accountingClassification);

				jeLine.deal_id = aptoSalesTransaction.invoice.dealId;

				jeLine.memo = JE_LINE_ITEM_MEMO_TAX_LIABILITY;

				jeLine.account = taxControlAccounts.getValue(tax.taxCode);
				jeLine.debit = tax.taxAmount;

				jeLine.employeeId = aptoSalesTransaction.invoice.primaryBrokerId;

				// crAmt += jeLine.debit;

				crAmt = math.number(math.add(math.bignumber(crAmt), math.bignumber(jeLine.debit)));
				this.lines.push(jeLine);


			};

			// let's create debit line
			var jeLine = new NSJELine();

			jeLine.vendorId = taxParticipant.vendorId;

			if (taxParticipant.hasOwnProperty("aptoVendorId"))
				jeLine.aptoVendorId = taxParticipant.aptoVendorId;

			jeLine.setAccountingClassification(aptoSalesTransaction.invoice.accountingClassification);

			jeLine.deal_id = aptoSalesTransaction.invoice.dealId;
			jeLine.clientId = aptoSalesTransaction.invoice.client;

			jeLine.memo = JE_LINE_ITEM_MEMO_TAX_LIABILITY;

			jeLine.account = ACCOUNT_CO_BROKER_COMMS_PAYABLE;

			jeLine.employeeId = aptoSalesTransaction.invoice.primaryBrokerId;

			jeLine.credit = crAmt;

			this.lines.push(jeLine);
		}


	}

	/**
	 * Crate JE suitable for payment application to invoice
	 *
	 * @param {APTOPayment} aptoPayment
	 * @param {string} dealId - ns internal ID of custom record DEAL ID
	 * @param {string} arAccount - ns internal ID of AR account this payment has to go into
	 * @param {InvoiceTaxInformation} invoiceTaxInformation - information about invoice we are going to pay
	 */
	this.populateFromAPTOPayment = function(aptoPayment, dealId, arAccount, invoiceTaxInformation)
	{
		// header information is populated from invoice

		nlapiLogExecution("DEBUG","Populating JE header");
		this.subsidiary = aptoPayment.accountingClassification.subsidiary;

		var postingPeriod = null;

		this.tranDate = nlapiDateToString(dateInMillis2date(aptoPayment.transactionDateInMillis), DATE_MASK);
		try
		{
			postingPeriod = accountingPeriodSearch(dateInMillis2date(aptoPayment.transactionDateInMillis),this.subsidiary);

		}
		catch (error)
		{
			postingPeriod = adjustmentAccountingPeriodSearch(this.tranDate,this.subsidiary);

			this.tranDate = postingPeriod.lastSunday;
		}

		this.postingPeriod = postingPeriod.id;


		var currencyMap = new CurrencyMap();

		this.currency = currencyMap.getValue(aptoPayment.currency);
		this.aptoPaymentNumber = aptoPayment.aptoPaymentNumber;

		// this.aptoInvoice = aptoSalesTransaction.invoice.invoiceNo;

		nlapiLogExecution("DEBUG","Creating line 1");
		var jeLine = new NSJELine();

		jeLine.createLineForPaymentJE(aptoPayment.billTo,
				dealId,
				aptoPayment.hasOwnProperty("memo")?aptoPayment.memo:null,
				arAccount, // ACCOUNT_BROKERAGE_COMMS_RECEIVABLE; changed to value passed from invoice - making code more flexible
				aptoPayment.amount,
				null);


		this.lines.push(jeLine);


		if (aptoPayment.paymentMethod == PAYMENT_METHOD_CO_BROKER_TRUST_CHECK)
		{
			nlapiLogExecution("DEBUG","Creating line 2", "Co-Broker Trust Check");
			var jeLine = new NSJELine();

			jeLine.createLineForPaymentJE(aptoPayment.billTo,
					dealId,
					aptoPayment.hasOwnProperty("memo")?aptoPayment.memo:null,
					ACCOUNT_TRUST_LIABILITY,
					null,
					aptoPayment.amount);
			this.lines.push(jeLine);
		}
		else
		{
			nlapiLogExecution("DEBUG","Creating more lines", "Bad Debt Write Off");
			if (arAccount == ACCOUNT_REC_BILLED_EARNED)
			{
				var tax1amount = invoiceTaxInformation.getTax1Amount(aptoPayment.amount);
				var tax2amount = invoiceTaxInformation.getTax2Amount(aptoPayment.amount);

				var badDebtWriteOffAmount = math.number(math.chain(math.bignumber(aptoPayment.amount))
												.subtract(math.bignumber(tax1amount))
												.subtract(math.bignumber(tax2amount)).done());
				if (tax1amount > 0)
				{
					nlapiLogExecution("DEBUG","Creating more lines","GST/HST");
					var jeLine = new NSJELine();
					jeLine.createLineForPaymentJE(aptoPayment.billTo,
							dealId,
							aptoPayment.hasOwnProperty("memo")?aptoPayment.memo:null,
							ACCOUNT_GST_HST_ON_SALE,
							null,
							tax1amount);
					this.lines.push(jeLine);
				}

				if (tax2amount > 0)
				{
					nlapiLogExecution("DEBUG","Creating more lines","QST");
					var jeLine = new NSJELine();
					jeLine.createLineForPaymentJE(aptoPayment.billTo,
							dealId,
							aptoPayment.hasOwnProperty("memo")?aptoPayment.memo:null,
							ACCOUNT_QST_ON_SALE,
							null,
							tax2amount);
					this.lines.push(jeLine);
				}

				var jeLine = new NSJELine();
				jeLine.createLineForPaymentJE(aptoPayment.billTo,
						dealId,
						aptoPayment.hasOwnProperty("memo")?aptoPayment.memo:null,
						ACCOUNT_BAD_DEBT_WRITE_OFFS,
						null,
						badDebtWriteOffAmount);

				this.lines.push(jeLine); /// need to figure out tax breakdown
			}
			else if (arAccount == ACCOUNT_REC_UNBILLED_EARNED)
			{
				var jeLine = new NSJELine();
				jeLine.createLineForPaymentJE(aptoPayment.billTo,
						dealId,
						aptoPayment.hasOwnProperty("memo")?aptoPayment.memo:null,
						ACCOUNT_BAD_DEBT_WRITE_OFFS,
						null,
						aptoPayment.amount);
				this.lines.push(jeLine);
			}
			else if (arAccount == ACCOUNT_REC_UNBILLED_UNEARNED)
			{
				var jeLine = new NSJELine();
				jeLine.createLineForPaymentJE(aptoPayment.billTo,
						dealId,
						aptoPayment.hasOwnProperty("memo")?aptoPayment.memo:null,
						ACCOUNT_REV_UNBILLED_UNEARNED,
						null,
						aptoPayment.amount);
				this.lines.push(jeLine);
			}

		}


	}
	/**
	 * Since JS does not allow multiple constructors, creating populate function
	 * @param {nlobjRecord} jeRec
	 * @param {APTOTransaction} aptoSalesTransaction
	 */
	this.populateFromJEAndSalesTransaction = function(jeRec, aptoSalesTransaction)
	{
		// header information is not needed in this case

		var taxControlAccounts = new TaxControlAccounts();

		nlapiLogExecution("DEBUG", aptoSalesTransaction.thirdPartyTaxes.length + " participants found");
		

		// line items are created from 3rd party tax data
		for (var int = 0; int < aptoSalesTransaction.thirdPartyTaxes.length; int++) {
			/**
			 * One 3rd party participant to this transaction
			 */
			taxParticipant = aptoSalesTransaction.thirdPartyTaxes[int];
			

			var crAmt = 0; // need to calculate credit amount for all debit records we are about to create

			nlapiLogExecution("DEBUG", taxParticipant.taxes.length + " tax codes");

			// now we need to look at every tax amount (and tax code) associated with this party
			for (var i = 0; i < taxParticipant.taxes.length; i++) {
				var tax = taxParticipant.taxes[i];

				var jeLine = new NSJELine();

				jeLine.vendorId = taxParticipant.vendorId;

				if (taxParticipant.hasOwnProperty("aptoVendorId")) // backwards compatability
					jeLine.aptoVendorId = taxParticipant.aptoVendorId;


				jeLine.clientId = aptoSalesTransaction.invoice.client;

				jeLine.setAccountingClassification(aptoSalesTransaction.invoice.accountingClassification);

				jeLine.deal_id = aptoSalesTransaction.invoice.dealId;

				jeLine.memo = JE_LINE_ITEM_MEMO_TAX_LIABILITY;

				jeLine.account = taxControlAccounts.getValue(tax.taxCode);
				jeLine.debit = tax.taxAmount;

				jeLine.employeeId = aptoSalesTransaction.invoice.primaryBrokerId;


				crAmt = math.number(math.add(math.bignumber(crAmt), math.bignumber(jeLine.debit) ));

				// crAmt += jeLine.debit;

				this.lines.push(jeLine);


			};

			// let's create debit line
			var jeLine = new NSJELine();

			if (taxParticipant.hasOwnProperty("aptoVendorId")) // backwards compatability
				jeLine.aptoVendorId = taxParticipant.aptoVendorId;

			jeLine.vendorId = taxParticipant.vendorId;

			jeLine.setAccountingClassification(aptoSalesTransaction.invoice.accountingClassification);

			jeLine.deal_id = aptoSalesTransaction.invoice.dealId;
			jeLine.clientId = aptoSalesTransaction.invoice.client;

			jeLine.memo = JE_LINE_ITEM_MEMO_TAX_LIABILITY;

			jeLine.account = ACCOUNT_CO_BROKER_COMMS_PAYABLE;

			jeLine.employeeId = aptoSalesTransaction.invoice.primaryBrokerId;

			jeLine.credit = crAmt;

			this.lines.push(jeLine);
		};
	};
}

/**
 * Line item of the journal entry.
 * @class
 */
NSJELine = function()
{
	/**
	 * Account for this line item (NS internal ID)
	 */
	this.account = "";

	/**
	 * Department (NS internal ID)
	 */
	this.department = "";
	/**
	 * Location / Market Cost Center (NS internal ID)
	 */
	this.location = "";
	/**
	 * Category aka class of this entry (NS internal ID)
	 */
	this.classification = "";

	/**
	 * DR amount (Each line could have one of debit or credit amounts in it)
	 */
	this.debit = NaN;
	/**
	 * CR amount (Each line could have one of debit or credit amounts in it)
	 */
	this.credit = NaN;

	/**
	 * Text memo that could be added to this line item
	 */
	this.memo = "";

	/**
	 * DEAL ID link (NS internal ID)
	 */
	this.deal_id = "";

	/**
	 * Vendor associated with this line (NS internal ID)
	 */
	this.vendorId = "";

	/**
	 * APTO vendor id (required for updates to JE if vendor was not specified initially)
	 */
	this.aptoVendorId = "";

	/**
	 * Client associated with this line item (NS internal ID)
	 */
	this.clientId = "";

	/**
	 * BILL TO (NS internal ID) - use this field if you would need to associate JE with BILL TO and use it as credit
	 */
	this.billTo = "";
	/**
	 * set accounting classifications for line item
	 * @param {AccountingClassification} accountingClassification
	 */
	this.setAccountingClassification = function(accountingClassification)
	{
		this.department = accountingClassification.department;

		this.location = accountingClassification.market;

		this.classification = accountingClassification.category;
	};

	/**
	 * set accounting classifications for line item from NetSuite record
	 * @param {nlobjRecord} record
	 */
	this.setAccountingClassificationFromRecord = function(record)
	{
		this.department = record.getFieldValue("department");

		this.location = record.getFieldValue("location");

		this.classification = record.getFieldValue("class");
	};

	/**
	 * NS employee id (sales person from the invoice)
	 */
	this.employeeId = "";

	/**
	 * Special case - create JE line for payment. Some of the attributes are defaulted
	 * @param {string} billTo
	 * @param {string} dealId
	 * @param {string} memo
	 * @param {string} account
	 * @param {string} credit
	 * @param {string} debit
	 */
	this.createLineForPaymentJE = function(billTo, dealId, memo, account, credit, debit)
	{
		nlapiLogExecution("DEBUG","Create Line", account + " " + credit + "" + debit);
		this.billTo = billTo;

		this.department = PAYMENT_DEFAULT_DEPT;
		this.location = PAYMENT_DEFAUL_MCC;
		this.classification = PAYMENT_DEFAULT_CATHEGORY;

		this.deal_id = dealId;

		if (memo != null)
			this.memo =  memo;

		this.account = account;
		if (credit != null)
			this.credit = credit;
		else if (debit != null)
			this.debit = debit;
	}

};

/**
 * Most of Apto integration calls return data in this format (exceptions are old functions created by Apto)
 * @class
 */
RESTLetResult = function()
{
	/**
	 * Success or failure flag.
	 */
	this.isSuccess = false;
	/**
	 * Internal id of NS invoice created
	 */
	this.invoiceId = "";

	/**
	 * Internal id of NS payment created
	 */
	this.paymentId = "";

	/**
	 * Payment balance after successful application to invoice
	 */
	this.balance = 0;

	/**
	 * Return adjustments period (if operation performed was adjustment) AYPC-493
	 */
	this.transactionDateInMillis = 0;

	/**
	 * NS Invoices and their balances - will only be set if
	 * result is returned for payment application
	 */
	this.invoiceBalances = {};
	/**
	 * Error code in case of failure.
	 * Error code could have few formats
	 * -- if it starts with "RESTLET_" - error generated by integration RESTLet
	 * -- if it starts with "NETSUITE_" - it has been produced by NS and probably indicates logical issue with data
	 * -- Anything else indicates unexpected error due to corrupt data or bug in code. Debug log should be enabled and
	 * consulted for additional information
	 */
	this.errorCode = "";
	/**
	 * Optional parameter - set to value if this sales transaction was processed as a part of the batch
	 */
	this.batchTransactionId = "";
}

/**
 * @class
 */
TaxParticipant = function()
{
	/**
	 * Name of the 3rd party to the transaction
	 */
	this.name = "";

	/**
	 * NS internal vendor id
	 */
	this.vendorId = "";


	/**
	 * Since NetSuite vendor id is not required at the time of the invoice creation,
	 * we need a link to update vendor id once it's provided.
	 */
	this.aptoVendorId = "";
	/**
	 * List of tax codes and associated amounts
	 * @see TaxCodesAndAmounts
	 */
	this.taxes = new Array();
}
/**
 * Tax code and amount for transaction participant
 * @class
 */
TaxCodesAndAmounts = function()
{
	/**
	 * Tax code @see TAX_CODE_ constants for possible values.
	 */
	this.taxCode = "",
	/**
	 * Amount of taxes 3rd party transaction participant has to pay
	 */
	this.taxAmount = 0;
}
/**
 * APTO transaction wrapper - all your data belongs to us
 * @class
 */
APTOTransaction = function()
{
	/**
	 * Please specify batch transaction id, if this transaction part of the batch.
	 * This field would not be persisted in NetSuite, but would be paired with result code
	 */
	this.batchTransactionId = "";
	/**
	 * {APTOInvoice} invoice port of the transaction. At this point it's mandatory
	 */
	this.invoice = {};
	/**
	 * Optional parameter
	 *
	 * As a part of the revenue recognition, we need to apply credit memo to previously create invoice -
	 * please provide internal NetSuite ID
	 */
	this.offsetInvoice = "";

	/**
	 * Optional parameter - Canada only.
	 *
	 * Third party participants and taxes they need to pay.
	 *
	 * Used to create JE to reduce tax liability
	 */
	this.thirdPartyTaxes = {};

}

/**
 * Batch mode operations
 * <b>Important!</b> all batch operations should be using this class,
 * type of batch[] array element would be dependent on operation
 * @class
 */
APTOSalesBatch = function()
{
	/**
	 * Array of {APTOTransaction}
	 */
	this.batch = new Array();

	/**
	 * Switch - how to handle errors on the batch
	 */
	this.failOnError = false;
}

/**
 * APTO needs to know balance on a given payment
 * So it can deal with the fact that payments can be applied in NetSuite
 * @class
 */
APTOPaymentBalance = function()
{
	/**
	 * NetSuite payment id, I am assuming we might use it in the batch
	 */
	this.paymentId = "";
	/**
	 * Currency of this payment @see CURRENCY_ constants
	 */
	this.currency = "";
	/**
	 * Initial amount of the payment.
	 * Seems like useless information, but it's good for debugging
	 */
	this.amount = 0;
	/**
	 * Current balance on this payment
	 */
	this.balance = 0;
}

/**
 * Data needed in NetSuite in order to record BILL TO payment
 * coming from APTO
 * @class
 */
APTOPayment = function()
{
	/**
	 * Internal ID of NetSuite BILL_TO (customer)
	 */
	this.billTo = "";

	/**
	 * NetSuite payment id
	 */
	this.paymentId = "";

	/**
	 * 4 required NS fields @see AccountingClassification
	 * {AccountingClassification} accountingClassification
	 */
	this.accountingClassification = new AccountingClassification();

	/**
	 * Check number or EFT reference number
	 */
	this.checkNumber = "";

	/**
	 * Currency for this payment. @see CURRENCY_ constants for valid values
	 */
	this.currency = "";

	/**
	 * User-visible payment id (or number) that could be helpful in troubleshooting.
	 * In NetSuite it would go into externalId (to prevent duplicates) and memo fields
	 */
	this.aptoPaymentNumber = "";


	/**
	 * Optional memo field (used for adjustment reasons)
	 */
	this.memo = "";
	/**
	 * Payment amount
	 */
	this.amount = 0;

	/**
	 * Method of payment. See PAYMENT_METHOD_ constants
	 * Something tells me that we would only be using check and EFT in this implementation
	 * (other business lines could  be using CCs)
	 */
	this.paymentMethod = "";

	/**
	 * Remote deposit scanner support - user entered ID of the deposit batch
	 */
	this.depositScannerId = "";

	/**
	 * Transaction date in milliseconds since 1970 (used to define accounting period this payment belongs to)
	 */
	this.transactionDateInMillis = 0;

	/**
	 * Should this payment be voided?
	 * used in edit calls only
	 */
	this.isVoided = false;
	/**
	 * Pseudo-constructor - populate from information stored in
	 * custom record
	 *
	 * @param  {nlobjRecord} coBrokerPayment
	 * @param {string} shortTableName
	 */
	this.populateFromCoBrokerTrustPaymentRecord = function(coBrokerPayment, shortTableName)
	{

		if (shortTableName == null)
			shortTableName = "cbcr";

		this.billTo = coBrokerPayment.getFieldValue("custrecord_" + shortTableName + "_bill_to");

		this.accountingClassification.subsidiary = coBrokerPayment.getFieldValue("custrecord_" + shortTableName + "_subsidiary");

		this.checkNumber = coBrokerPayment.getFieldValue("custrecord_" + shortTableName + "_check_number");

		var currencyMap = new CurrencyMap();

		this.currency = currencyMap.getKey(coBrokerPayment.getFieldValue("custrecord_" + shortTableName + "_currency"));

		this.aptoPaymentNumber = coBrokerPayment.getFieldValue("name");

		this.memo = coBrokerPayment.getFieldValue("custrecord_" + shortTableName + "_memo");

		this.amount = coBrokerPayment.getFieldValue("custrecord_" + shortTableName + "_amount");

		this.depositScannerId = coBrokerPayment.getFieldValue("custrecord_" + shortTableName + "_deposit_scanner_id");

		// coBrokerPayment.getFieldValue("custrecord_" + shortTableName + "_deposit_account",depositAccountId);

		this.transactionDateInMillis = nlapiStringToDate(coBrokerPayment.getFieldValue("custrecord_" + shortTableName + "_transaction_date"), DATE_MASK).getTime();

		this.paymentMethod = PAYMENT_METHOD_CHEQUE;
	}
};

/**
 * Apto payment application information
 * @class
 */
APTOPaymentApplication = function()
{
	/**
	 * NS Internal Payment Id
	 */
	this.paymentId = "";

	/**
	 * List of invoices and amounts this payment should be applied to
	 */
	this.invoices = new Array();

	/**
	 * Is this application really is un-application?
	 */
	this.isUnapply = false;

	/**
	 * pseudo-constructor (I want to copy data from JSON generic object into this class)
	 * @param {object}APTOPayment
	 */
	this.setData = function(dataIn)
	{
		this.paymentId = dataIn.paymentId;

		this.invoices = {};

		for (var int = 0; int < dataIn.invoices.length; int++) {
			this.invoices[dataIn.invoices[int].invoiceId] = dataIn.invoices[int].amount;
			if (dataIn.invoices[int].amount < 0)
				this.isUnapply = true;
		}

	}
	/**
	 * Get amount to apply to invoice (by invoice internal id)
	 *
	 * @param {string} invoiceId NetSuite internal id of invoice record
	 */
	this.getAmount = function(invoiceId)
	{
		var amount = 0;

		if (this.invoices.hasOwnProperty(invoiceId))
			amount = this.invoices[invoiceId];

		return amount;
	};

	/**
	 * Check if this invoice was part of payment application
	 * @param {string} invoiceId NetSuite internal id of invoice record
	 */
	this.isValidInvoice = function(invoiceId)
	{
		return this.invoices.hasOwnProperty(invoiceId);
	}

	this.unApplyRequest = function()
	{
		return this.isUnapply;
	}
};

/**
 * Reference to NetSuite invoice and amount that should be applied to it
 * @class
 */
APTOPaymentInvoice = function()
{
	/**
	 * NS internal ID of the invoice
	 */
	this.invoiceId = "";

	/**
	 * Amount to apply to this invoice
	 */
	this.amount = 0;
}

/**
 * New Functionality - void invoice (Admin function)
 * We need invoice id in order to know what to do
 * @class
 */
APTOVoidInvoice = function()
{

	/**
	 * APTO invoice number
	 *
	 * @type String
	 */
	this.aptoInvoiceNo = "";

	/**
	 * Please specify batch transaction id, if this transaction part of the batch.
	 * This field would not be persisted in NetSuite, but would be paired with result code
	 */
	this.batchTransactionId = "";
}

/**
 * In order to void transactions, I have to find them first
 * Generic search across multiple transaction types will give me list of items we have
 * @class
 */
NSSearchResults = function(kind, id)
{
	this.kind = kind;
	this.id = id;
}

/**
 * Reference to NetSuite invoice and outstanding balance on it
 * @class
 */
APTOInvoiceBalance = function()
{
	/**
	 * NS internal ID of the invoice
	 */
	this.invoiceId = "";

	/**
	 * Balance on the invoice after payment(s) application
	 */
	this.balance = 0;
}

/**
 * Apto Entity search (bill to or vendor). Request coming over to us
 * @class
 */
APTOEntitySearch = function()
{
	/**
	 * transaction id of this search request
	 */
	this.batchTransactionId = "";

	/**
	 * Search Type, supported types are "vendor" and "billto"
	 * @type {string}
	 */
	this.searchType

	/**
	 * Are we searching for company of individual vendor?
	 * @type {string}
	 */
	this.companySearch = "F";

	/**
	 * use if we are looking for vendor who is a person
	 * @type {string}
	 */
	this.firstName = "";

	/**
	 * use if we are looking for vendor who is a person
	 * @type {string}
	 */
	this.lastName = "";

	/**
	 * use if we are looking for company
	 * @type {string}
	 * @depricated
	 */
	this.vendorName = "";

	/**
	 * Use company name (generic search parameter) instead of @see vendorName
	 * @type {string}
	 */
	this.companyName = "";

	/**
	 * ISO code of the transaction currency
	 * @type {string}
	 */
	this.currency = "";

	/**
	 * NetSuite internal ID of the subsidiary we are performing this search for
	 * @type {string}
	 */
	this.subsidiary = "";
}
/**
 * Apto entity search results (batch mode)
 * @class
 */
APTOEntitySearchResultBatch = function()
{
	/**
	 * transaction id of this search request
	 */
	this.batchTransactionId = "";

	/**
	 * Vendors found by this search
	 */
	this.searchResults = [];

	/**
	 * Success or failure flag.
	 */
	this.isSuccess = false;

	this.errorCode = "";
}
/**
 * Apto entity search result
 * @class
 */
APTOEntitySearchResult = function()
{
	/**
	 *  NetSuite internal ID of the vendor
	 */
	this.internalid = "";

	/**
	 * Vendor name (will be used for both companies and individuals)
	 */
	this.companyname = "";

	/**
	 * Vendor address returned as a single string.
	 */
	this.billaddress = "";

	/**
	 * Tax ID Name - for Canada it is "BCN"
	 */
	this.taxIdName = "";

	/**
	 * Tax ID (or BCN for Canada)
	 */
	this.taxId = "";

	/**
	 * External ID 
	 */
	this.extid = "";
}

/**
 * APTO request to get posting period for list of invoices
 * @class
 */
APTOGetPostingPeriodRequest = function()
{
	/**
	 * transaction id of this get request
	 * @type {string}
	 */
	this.batchTransactionId = "";

	/**
	 * List of invoices we need to check
	 * @see APTOGetPostingPeriodRequestInvoice
	 * @type {APTOGetPostingPeriodRequestInvoice[]}
	 */
	this.invoices = [];
}

/**
 * Single invoice information for posting period request
 * @class
 */
APTOGetPostingPeriodRequestInvoice = function()
{
	/**
	 * NetSuite internal invoice number
	 */
	this.nsInvoiceId = "";

	/**
	 * This property will be only used by response code - should not be populated on request
	 */
	this.transactionDateInMillis = null;
}

/**
 * Response for request to get posting period for list of invoices
 * @class
 */
APTOGetPostingPeriodResponse = function()
{
	/**
	 * transaction id of this get request
	 * @type {string}
	 */
	this.batchTransactionId = "";

	/**
	 * List of invoices and posting date (will be last date of the month for this period)
	 * @see APTOGetPostingPeriodRequestInvoice
	 * @type {APTOGetPostingPeriodRequestInvoice[]}
	 */
	this.invoices = [];
}

/**
 * NS Invoice tax management class
 * to be used with bad debt write off JE creation. I will need to read effective
 * taxes from CAD invoice
 * @class
 */
InvoiceTaxInformation = function()
{
	this.tax1rate = 0;
	this.tax2rate = 0;

	this.effectiveRate = 0;

	/**
	 * Get tax information from loaded NS record
	 * @param {nlobjRecord} invoice
	 */
	this.getTaxesFromInvoice = function(invoice)
	{
		var onePercent = math.divide(math.bignumber(invoice.getFieldValue("subtotal")),math.bignumber("100"));

		if (invoice.getFieldValue("taxtotal") != "")
			this.tax1rate = math.number(math.divide(math.bignumber(invoice.getFieldValue("taxtotal")), onePercent));
		if (invoice.getFieldValue("tax2total") != "")
			this.tax2rate = math.number(math.divide(math.bignumber(invoice.getFieldValue("tax2total")), onePercent));

		this.effectiveRate = math.chain(math.bignumber(100))
        					.add(math.bignumber(this.tax1rate))
        					.add(math.bignumber(this.tax2rate)).done();

		this.effectiveRate = math.round(math.divide(math.bignumber(this.effectiveRate),100),2);

		nlapiLogExecution("DEBUG", "Invoice Tax Rate", this.effectiveRate);
	}

	/**
	 * Get tax 1 amount based on processed invoice
	 * @param {string} amount
	 * return {number} taxAmount
	 */
	this.getTax1Amount = function(amount)
	{
		var taxAmount = 0;

		if (this.tax1rate > 0)
		{
			var baseAmount =  math.round(math.divide(math.bignumber(amount),this.effectiveRate),2);

			taxAmount = math.number(math.round(math.chain(baseAmount)
                    .multiply(math.bignumber(this.tax1rate))
                    .divide(math.bignumber("100")).done(),2));
		}



		return taxAmount;
	}
	/**
	 * Get tax 2 amount based on processed invoice
	 * @param {string} amount
	 * return {number} taxAmount
	 */
	this.getTax2Amount = function(amount)
	{
		var taxAmount = 0;

		if (this.tax2rate > 0)
		{
			var baseAmount =  math.round(math.divide(math.bignumber(amount),this.effectiveRate),2);

			taxAmount = math.number(math.round(math.chain(baseAmount)
                    .multiply(math.bignumber(this.tax2rate))
                    .divide(math.bignumber("100")).done(),2));
		}




		return taxAmount;
	};
}