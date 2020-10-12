/**
 * ay_trust_association.js
 *@NApiVersion 2.0
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime'],
	function(search, record, email, runtime)
	{
	
		/**
		 * Get trust deposit id from vendor bill
		 * 
		 * @param {'N/record'} record 
		 * @param {search.Result} result - Vendor Payment record informaiton - search result 
		 * 
		 * @returns {string} NetSuite internal record id of trust deposit (custom record) 
		 */
		function getTrustDepositId(record, result)
		{
			var trustDepositId = null;
			var billRecordId = null;
			
			var billPaymentRecord = record.load({id: result.id,
				type: result.recordType,
				isDynamic: false});
			
			var lineCount = billPaymentRecord.getLineCount({ sublistId: 'apply'});
	        
			log.debug({title: 'Looking up Trust Deposit', details: "Searching for associated vendor bill"});

            for (var i = 0; i < lineCount; i++) {
            		if (billPaymentRecord.getSublistValue({ sublistId: 'apply',
            											   fieldId: 'trantype', 
            											   line : i}) == "VendBill")
            		{
            			
            			billRecordId = billPaymentRecord.getSublistValue('apply','internalid', i) // now we have bill this payment is assocaited with 
            			break;
            		}
 
            }
			
            if (billRecordId == null)
            	{
            		log.debug({title: 'Looking up Trust Deposit', details: "vendor bill not found"});
            	}
            else
            	{
	            	log.debug({title: 'Looking up Trust Deposit', details: 'Vendor Bill ' + billRecordId});
	    			
	    			var trustDepositAssociation = search.lookupFields({type : record.Type.VENDOR_BILL, id: billRecordId, columns : 'custbody_trust_deposit_association'});
	    			
	    			if (trustDepositAssociation.custbody_trust_deposit_association.length > 0)
	    			{
	    				log.debug({title: 'Looking up Trust Deposit', details: 'Trust Deposit ' + trustDepositAssociation.custbody_trust_deposit_association[0].text});
	    				trustDepositId = trustDepositAssociation.custbody_trust_deposit_association[0].value;
	    			}
	    			else
	    				log.debug({title: 'Looking up Trust Deposit', details: 'Not Found'});
            	}
			
			
			return trustDepositId;
		}
		
		/**
		 * Associate trust deposit with payment record using supplied ids
		 * 
		 * @param {N/record} record
		 * @param {string} trustDepositId - NS trust deposit internal id
		 * @param {string} billPaymentId - NS vendor bill payment internal id 
		 */
		function associateTrustDepositWithPayment(record, trustDepositId, billPaymentId)
		{
			var trustDeposit = search.lookupFields({type : 'customrecord_trust_deposit', id: trustDepositId, columns : 'isinactive'});
			
			log.debug('Trust Deposit', JSON.stringify(trustDeposit));
			
			var trustDepositInactive = trustDeposit.isinactive;
		
			
			if (trustDepositInactive)
			{
				log.debug({title: "Re-activating Trust Deposit", details: "Trust Deposit " + trustDepositId});
				record.submitFields({type: 'customrecord_trust_deposit',
						    			  id: trustDepositId,
						    	      values: {'isinactive' : "F"}});
				
			}
					
			record.submitFields({type: 'vendorpayment',
					    			  id: billPaymentId,
					    	      values: {'custbody_trust_deposit_association' : trustDepositId}});
			
			log.debug({title: "AY Trust Association", details: "Vendor Bill " + billPaymentId + " trust Deposit " + trustDepositId});
			
			if (trustDepositInactive)
			{
				log.debug({title: "De-activating Trust Deposit", details: "Trust Deposit " + trustDepositId});
				record.submitFields({type: 'customrecord_trust_deposit',
						    			  id: trustDepositId,
						    	      values: {'isinactive' : "T"}});
				
			}
		}
		/**
		 * Exported method - fix trust payment association
		 */
		function doFix()
		{
            var searchId = 757; // hardcoded saved search created by Carol
            
            try {
            		var logTitle = 'AY Trust Association';
            		
                search.load({
                    id: searchId
                }).run().each(function(result) 
                		{
                			log.debug({ title: logTitle,
			                        details: 'Processing Bill Payment ' + result.id});
			         			            		
				        var trustDepositId = getTrustDepositId(record, result);
	                    
		                if (trustDepositId != null)
	                    {               		
		                		associateTrustDepositWithPayment(record, trustDepositId, result.id)
	                    	    
	                    		// return false;
	                    }
			            
			            return true;
                		});
            }
            catch (e)
            {
            		log.error({title: "Error", details: JSON.stringify(e)});
            }
		}
		return { 
			fixBillPaymentAssociations: doFix
		}
 });