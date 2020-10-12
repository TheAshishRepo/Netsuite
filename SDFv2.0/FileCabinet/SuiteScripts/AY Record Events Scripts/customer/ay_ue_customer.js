/**
 * Bill To (customer) User Event Script
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *
 *@module ay_ue_customer
 */

// Load two standard modules.

define ( ['N/record', 'N/runtime', 'N/ui/message', 'N/task'] ,

    function(record, runtime, message, task) {

		/**
		 * Default debug log title
		 * @var
		 */
		var logTitle = "AY | UE | Bill To";

		/**
		 * User Event - before load
		 * @method myBeforeLoad
		 * @param {context} context
		 */
        function myBeforeLoad (context) {
        	return ;

        }

		/**
		 * User Event - before submit
		 * @method myBeforeSubmit
		 * @param {context} context
		 */
        function myBeforeSubmit(context) {
            return ;


        }

		/**
		 * @summary User Event - after submit
		 *
		 * @description Check saved bill to / customer record. If needed - schedule task to update subsidiary list
		 *
		 * @param {context} context
		 *
		 * @method myAfterSubmit
		 */
        function myAfterSubmit(context) {

        		if ((runtime.executionContext == runtime.ContextType.USER_INTERFACE ||
        				runtime.executionContext == runtime.ContextType.CSV_IMPORT) &&
        		    (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.CREATE))
    		{
        			var oldRec = context.oldRecord;
            		var newRec = context.newRecord;

            		if (context.type == context.UserEventType.CREATE ||
            				(newRec.getValue({fieldId : 'custentity_ay_entity_scope'}) != oldRec.getValue({fieldId : 'custentity_ay_entity_scope'}) ))
            		{
            			msg = message.create({
    			            title: "Updating Subsidiary List",
    			            message: "Please refresh screen to see updated list in few seconds",
    			            type:  message.Type.CONFIRMATION});

    				msg.show({ duration : 2000 });
            			log.debug(logTitle, "Updating " + newRec.type + " record " + newRec.id + " with scope " + newRec.getValue({fieldId : 'custentity_ay_entity_scope'}) + " from " + runtime.executionContext);

            			var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});

            			scriptTask.scriptId = 'customscript_ay_ss_customer';
            			// scriptTask.deploymentId = 'customdeploy_ay_ss_customer';

            			scriptTask.params = {custscriptentityid: newRec.id,
            								custscriptentityscope: newRec.getValue({fieldId : 'custentity_ay_entity_scope'}),
            								custscriptprimarysubid: newRec.getValue({fieldId : 'subsidiary'}),
            								custscriptentitytype : newRec.type};
            			for (var i = 1; i <= 5; i++) {
            				scriptTask.deploymentId = 'customdeploy_ay_ss_customer' + i;
            				try
            				{
            					var scriptTaskId = scriptTask.submit();
            					break;
            				}
            				catch (e)
            				{
            					log.debug("Error submitting job", JSON.stringify(e));
            				}



            			}

            		}
            		else
            			log.debug(logTitle, "Nothing to do, scope didn't change " + newRec.getValue({fieldId : 'custentity_ay_entity_scope'}));
    		}
        		else
        			log.debug(logTitle, "Not doing anything for " + runtime.executionContext + " " + context.type);
            return;

        }



        // Add the return statement that identifies the entry point functions.

        return {
            // beforeLoad: myBeforeLoad,
            // beforeSubmit: myBeforeSubmit,
            afterSubmit: myAfterSubmit

        };
    });
