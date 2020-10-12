/**
 *@NApiVersion 2.0
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', './ay_trust_association'],
    function(search, record, email, runtime, ay_trust_association) {
        function execute(context) {
        	
        		log.audit({
        		    title: 'AY Trust Association', 
        		    details: 'Script Started From ' + context.type
        		    });
        		
        		ay_trust_association.fixBillPaymentAssociations();
        		
        		log.audit({
        			title: 'AY Trust Association', 
        			details: 'Script Ended'
    		    		});
        		
            
        }
        return {
            execute: execute
        };
    });