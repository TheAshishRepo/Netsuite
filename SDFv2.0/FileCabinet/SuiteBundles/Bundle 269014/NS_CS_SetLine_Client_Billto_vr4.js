/**
* Company			Avison Young
* Type				NetSuite Client-Side SuiteScript
* Version			1.0.0.0
* Description		For this script on Vendor Bill/Vendor Credit lines - if the project or property
*                   is selected set the lines Client and Bill TO
*
* Change History
* 10/01/2015 - Creation
* 01/25/2017 - (1) On add ensure primary and secondary approver are not the same
* 01/25/2017 - (2) On Add if no primary or secondary approver are set - set when the first market cost center is known
* 09/21/2017 - Check the Allocation segments
* 10/05/2017 - On copy of a line clear the ic journal
* 11/27/2017 - Changed the Field Change logic so we improve
**/

function fieldchanged(type, name)
{

	if (name != 'custcol_je_property' && name != 'location' &&  name != 'custcol_project' && name != 'custcol_allocation_sub')
	{
		return true;
	}

    nlapiLogExecution('DEBUG','fieldchanges pre', 'Past Field Check ' + type + ' ' + name) ;

	if (type == 'expense' && name == 'custcol_je_property')
    {
	 var property = nlapiGetCurrentLineItemValue('expense','custcol_je_property');

	 if (property != null && property != '')
	 {
		 // Lookup the property bill to and client
		 var client = nlapiLookupField('customrecord_property', property, 'custrecord_client');
		 var billto = nlapiLookupField('customrecord_property', property, 'custrecord_bill_to');
		 if (client != null)
		 {
			var clientset = nlapiSetCurrentLineItemValue('expense', 'custcol_client', client);
         }
		 if (billto != null)
		 {
			var billtoset = nlapiSetCurrentLineItemValue('expense', 'customer', billto);
         }
	 }

   }

	if (type == 'expense' && name == 'location')
    {
		nlapiLogExecution('DEBUG','fieldchanges pre', 'Fields Expense Location type' + type) ;
		var currentLoc = nlapiGetCurrentLineItemValue('expense', 'location');
		if (!isEmpty(currentLoc) && isEmpty(nlapiGetFieldValue('custbody_bill_approver')) )
		{
			var approver = nlapiLookupField('location', currentLoc, 'custrecord_bill_primary_approver');
			nlapiSetFieldValue('custbody_bill_approver',approver);
		}

		if (!isEmpty(currentLoc) && isEmpty(nlapiGetFieldValue('custbody_billapprovalwf_secbillapprove')) )
		{
			var approver = nlapiLookupField('location', currentLoc, 'custrecord_bill_second_approver');
			nlapiSetFieldValue('custbody_billapprovalwf_secbillapprove',approver);
		}
    }

    if (type == 'item' && name == 'location')
    {
		nlapiLogExecution('DEBUG','fieldchanges pre', 'Fields Expense Location '  + currentLoc) ;
		var currentLoc = nlapiGetCurrentLineItemValue('item', 'location');
		if (!isEmpty(currentLoc) && isEmpty(nlapiGetFieldValue('custbody_bill_approver')) )
		{
			var approver = nlapiLookupField('location', currentLoc, 'custrecord_bill_primary_approver');
			nlapiSetFieldValue('custbody_bill_approver',approver);
			nlapiSetFieldValue('nextapprover',approver);
		}

		if (!isEmpty(currentLoc) && isEmpty(nlapiGetFieldValue('custbody_billapprovalwf_secbillapprove')) )
		{
			var approver = nlapiLookupField('location', currentLoc, 'custrecord_bill_second_approver');
			nlapiSetFieldValue('custbody_billapprovalwf_secbillapprove',approver);
		}
    }


   if (type == 'item' && name == 'custcol_je_property')
   {
	 var property = nlapiGetCurrentLineItemValue('item','custcol_je_property');

	 if (property != null && property != '')
	 {
		 // Lookup the property bill to and client
		 var client = nlapiLookupField('customrecord_property', property, 'custrecord_client');
		 var billto = nlapiLookupField('customrecord_property', property, 'custrecord_bill_to');
		 if (client != null)
		 {
			var clientset = nlapiSetCurrentLineItemValue('item', 'custcol_client', client);
         }
		 if (billto != null)
		 {
			var billtoset = nlapiSetCurrentLineItemValue('item', 'customer', billto);
         }
	 }

   }

   if (type == 'expense' && name == 'custcol_project')
   {
	 var project = nlapiGetCurrentLineItemValue('expense','custcol_project');

	 if (project != null && project != '')
	 {
		 // Lookup the property bill to and client
		 var client = nlapiLookupField('customrecord_ay_projects', project, 'custrecord_assoc_client');
		 var billto = nlapiLookupField('customrecord_ay_projects', project, 'custrecord_assoc_bill_to');
		 if (client != null)
		 {
			var clientset = nlapiSetCurrentLineItemValue('expense', 'custcol_client', client);
         }
		 if (billto != null)
		 {
			var billtoset = nlapiSetCurrentLineItemValue('expense', 'customer', billto);
         }
	 }


   }

   if (type == 'item' && name == 'custcol_project')
   {
	 var project = nlapiGetCurrentLineItemValue('item','custcol_project');

	 if (project != null && project != '')
	 {
		 // Lookup the property bill to and client
		 var client = nlapiLookupField('customrecord_ay_projects', project, 'custrecord_assoc_client');
		 var billto = nlapiLookupField('customrecord_ay_projects', project, 'custrecord_assoc_bill_to');
		 if (client != null)
		 {
			var clientset = nlapiSetCurrentLineItemValue('item', 'custcol_client', client);
         }
		 if (billto != null)
		 {
			var billtoset = nlapiSetCurrentLineItemValue('item', 'customer', billto);
         }
	 }

   }

   if (type == 'item' && name == 'custcol_allocation_sub')
   {
	  nlapiLogExecution('DEBUG','fieldchanges', 'Fields'  + type + ' name ' + name) ;
	  var subSet = nlapiSetCurrentLineItemValue('item', 'custcol_assoc_sub', '');
   }

   if (type == 'expense' && name == 'custcol_allocation_sub')
   {
	  nlapiLogExecution('DEBUG','fieldchanges', 'Fields'  + type + ' name ' + name) ;
	  var subSet = nlapiSetCurrentLineItemValue('expense', 'custcol_assoc_sub', '');
   }


return true;

}

function saveRecord(type, name)
{

		if (!isEmpty(nlapiGetFieldValue('custbody_bill_approver')) && !isEmpty(nlapiGetFieldValue('custbody_billapprovalwf_secbillapprove')))
	    {
		   if (nlapiGetFieldValue('custbody_bill_approver') == nlapiGetFieldValue('custbody_billapprovalwf_secbillapprove'))
		   {
	              alert ('The Primary and Secondary Bill Approvers may not be the same individual !!');
		          return false;
           }
	    }

		for (var i = 1; i <= nlapiGetLineItemCount('item'); i++ )
        {
		  var allocSub = nlapiGetLineItemValue('item', 'custcol_assoc_sub', i);
		  if (!isEmpty(allocSub))
		  {
  		     var allocCat    = nlapiGetLineItemValue('item', 'custcol_alloc_category', i);
  		     var allocDept   = nlapiGetLineItemValue('item', 'custcol_alloc_department', i);
  		     var allocCenter = nlapiGetLineItemValue('item', 'custcol_alloc_cost_center', i);

			 if (isEmpty(allocCat) || isEmpty(allocDept) || isEmpty(allocCenter))
		     {
				 var alertMsg = 'Item line: ' + i + ' is missing either the Allocation Category or Allocation Department or Allocation Market Cost Center – please add';
				 alert(alertMsg);
				 return false
			 }

		  }
	    }

		for (var i = 1; i <= nlapiGetLineItemCount('expense'); i++ )
        {
		  var allocSub = nlapiGetLineItemValue('expense', 'custcol_assoc_sub', i);
		  if (!isEmpty(allocSub))
		  {
  		     var allocCat    = nlapiGetLineItemValue('expense', 'custcol_alloc_category', i);
  		     var allocDept   = nlapiGetLineItemValue('expense', 'custcol_alloc_department', i);
  		     var allocCenter = nlapiGetLineItemValue('expense', 'custcol_alloc_cost_center', i);

			 if (isEmpty(allocCat) || isEmpty(allocDept) || isEmpty(allocCenter))
		     {
				 var alertMsg = 'Expense line: ' + i + ' is missing either the Allocation Category or Allocation Department or Allocation Market Cost Center – please add';
				 alert(alertMsg);
				 return false
			 }

		  }
	    }


		return true;

}

function validateLine(type, name)
{
	   var lineNbr     = nlapiGetCurrentLineItemValue('expense', 'line')
	   var icJournal   = nlapiGetCurrentLineItemValue('expense', 'custcol_assoc_ic')
	   nlapiLogExecution('DEBUG','ValidateLine', 'Line '  + lineNbr + ' IC ' + icJournal) ;
       if (isEmpty(lineNbr))
       {
		   nlapiSetCurrentLineItemValue('expense','custcol_assoc_ic','');
		   nlapiLogExecution('DEBUG','ValidateLine', 'In Clear Line ') ;
       }
	   return true;
}

function forceParseFloat(stValue)
  {
     var flValue = parseFloat(stValue);

     if (isNaN(flValue) || (Infinity == stValue))
     {
         return 0.00;
     }

     return flValue;
  }

function isEmpty(stValue) {
 if ((stValue == '') || (stValue == null) || (typeof stValue == "undefined"))
   {        return true;
   }
   return false;
}
