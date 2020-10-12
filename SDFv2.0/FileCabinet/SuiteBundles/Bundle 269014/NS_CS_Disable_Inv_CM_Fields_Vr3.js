/**
* Company			Avison Young
* Type				NetSuite Client-Side SuiteScript
* Version			1.0.0.0
* Description		This script Disable the columns on Invoices and Credit memos
*
* Change History
* 10/15/2015 - Created
* 11/09/2016 - Updated - for some forms the class,department and location will be disabled for others it will not be
* 9/20/2017  - Check if allocation settings - ensure that the allocation segments for category/department and cost center are set
* 10/5/2017  - On copy clear the ic journal
**/

function pageinit(type, name)
{

   var formid_to_enable = nlapiGetContext().getSetting('SCRIPT', 'custscript_form_id_disable_segment');
   var formid            =  nlapiGetFieldValue('customform');
   nlapiLogExecution('DEBUG',' Form ID ','FormID= ' + formid + 'enable= ' + formid_to_enable);
   //if (formid != formid_to_enable)
   //{	   
   //  nlapiDisableLineItemField('item', 'class', true)
   //  nlapiDisableLineItemField('item', 'department', true)
   //  nlapiDisableLineItemField('item', 'location', true)
  // } 	 
   nlapiDisableLineItemField('item', 'custcol_client', true)
   nlapiDisableLineItemField('item', 'custcol_je_deal', true)
   nlapiDisableLineItemField('item', 'custcol_je_deal', true)
   nlapiDisableLineItemField('item', 'custcol_je_property', true)
   nlapiDisableLineItemField('item', 'custcol_project', true)

}

function save(type, name)
{

//custcol_assoc_sub custcol_alloc_category custcol_alloc_department custcol_alloc_cost_center
//			alert ('The order does not balance.  Please review.');
//
       // Is there is an allocaton sub - but no allocation category/department or cost center - reject the sabe
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
	   
	   return true;

}

function validateLine(type, name)
{
	   nlapiLogExecution('DEBUG','ValidateLine', 'Fields'  + type + ' name ' + name) ; 
	   var lineNbr    = nlapiGetCurrentLineItemValue('item', 'line')
	   var lineNbrT    = nlapiGetCurrentLineItemValue('item', 'linenumber')
	   var icJournal  = nlapiGetCurrentLineItemValue('item', 'custcol_assoc_ic')
	   nlapiLogExecution('DEBUG','ValidateLine', 'Line '  + lineNbr + ' IC ' + icJournal + ' Line ' + lineNbrT) ;
       if (isEmpty(lineNbr))
       {
		   nlapiSetCurrentLineItemValue('item','custcol_assoc_ic','',false);
		   nlapiLogExecution('DEBUG','ValidateLine', 'In Clear Line ') ;
       }		   
	   return true;
}

function fieldchanged(type, name)
{
   // Execute this code when all the fields from item are sourced on the sales order.
 
   if (type == 'item' && name == 'custcol_allocation_sub')
   {
	  nlapiLogExecution('DEBUG','fieldchanges', 'Fields'  + type + ' name ' + name) ;
	  var subSet = nlapiSetCurrentLineItemValue('item', 'custcol_assoc_sub', '');
   }
 
return true;
   
}

function isEmpty(stValue) {   
	if ((stValue == '') || (stValue == null) || (typeof stValue == "undefined"))  
	{        
		return true;   
	}
	return false; 
}