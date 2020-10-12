/**
* Company			Avison Young
* Type				NetSuite Client-Side SuiteScript
* Version			1.0.0.0
* Description		For this script on Journal - if the project or property
*                   is selected set the lines Client and Bill TO
*
* Change History
* 10/01/2015 - Creation
* 10/05/2017 - Added a Validate Line function to remove any duplicate IC journals
**/

function pageinit(type, name)
{
	   nlapiDisableField('tranid',true);
}

function fieldchanged(type, name)
{
   // Execute this code when all the fields from item are sourced on the sales order.
   nlapiLogExecution('DEBUG','fieldchanges', 'Fields'  + type + ' name ' + name) ; 
 
   if (type == 'line' && name == 'custcol_je_property')
   {
	 var property = nlapiGetCurrentLineItemValue('line','custcol_je_property');
	 
	 if (property != null && property != '')
	 {
		 // Lookup the property bill to and client
		 var client = nlapiLookupField('customrecord_property', property, 'custrecord_client');
		 var billto = nlapiLookupField('customrecord_property', property, 'custrecord_bill_to');
		 if (client != null)
		 {
			var clientset = nlapiSetCurrentLineItemValue('line', 'custcol_client', client);
         }			 
		 if (billto != null)
		 {
			var billtoset = nlapiSetCurrentLineItemValue('line', 'entity', billto);
         }			 
	 }
   }
   
   if (type == 'line' && name == 'custcol_project')
   {
	 var project = nlapiGetCurrentLineItemValue('line','custcol_project');
	 
	 if (project != null && project != '')
	 {
		 // Lookup the property bill to and client
		 var client = nlapiLookupField('customrecord_ay_projects', project, 'custrecord_assoc_client');
		 var billto = nlapiLookupField('customrecord_ay_projects', project, 'custrecord_assoc_bill_to');
		 if (client != null)
		 {
			var clientset = nlapiSetCurrentLineItemValue('line', 'custcol_client', client);
         }			 
		 if (billto != null)
		 {
			var billtoset = nlapiSetCurrentLineItemValue('line', 'entity', billto);
         }			 
	 }
	 
   }
   
   if (type == 'line' && name == 'custcol_allocation_sub')
   {
	  var subSet = nlapiSetCurrentLineItemValue('line', 'custcol_assoc_sub', '');
	 
   }
 
return true;
   
}

function saveRecord(type, name)
{
        

		for (var i = 1; i <= nlapiGetLineItemCount('line'); i++ ) 
        {
		  var allocSub = nlapiGetLineItemValue('line', 'custcol_assoc_sub', i);
		  if (!isEmpty(allocSub))
		  {
  		     var allocCat    = nlapiGetLineItemValue('line', 'custcol_alloc_category', i);
  		     var allocDept   = nlapiGetLineItemValue('line', 'custcol_alloc_department', i);
  		     var allocCenter = nlapiGetLineItemValue('line', 'custcol_alloc_cost_center', i);
			 
			 if (isEmpty(allocCat) || isEmpty(allocDept) || isEmpty(allocCenter))
		     {
				 var alertMsg = 'Journal line: ' + i + ' is missing either the Allocation Category or Allocation Department or Allocation Market Cost Center – please add';
				 alert(alertMsg);
				 return false
			 }

		  }
	    }

		
		return true;

}

function validateLine(type, name)
{
	   nlapiLogExecution('DEBUG','ValidateLine', 'Fields'  + type + ' name ' + name) ; 
	   var lineNbr    = nlapiGetCurrentLineItemValue('line', 'line')
	   var accountNbr = nlapiGetCurrentLineItemValue('line', 'account')
	   var icJournal  = nlapiGetCurrentLineItemValue('line', 'custcol_assoc_ic')
	   nlapiLogExecution('DEBUG','ValidateLine', 'Line '  + lineNbr + ' Account ' + accountNbr + ' IC ' + icJournal) ;
       if (isEmpty(lineNbr))
       {
		   nlapiSetCurrentLineItemValue('line','custcol_assoc_ic','',false);
	   }		   
	   return true;
}


function isEmpty(stValue) {   
 if ((stValue == '') || (stValue == null) || (typeof stValue == "undefined"))  
   {        return true;   
   }    
   return false; 
}


