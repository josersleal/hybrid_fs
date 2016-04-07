var LOG = function(){
	"use strict";
	var debug = false;

	function startDebugMode(){
		debug = true;
	}

	function isDebug(){
		return isDebug;
	}

	function say(message){
		if(debug){
			alert(message);
		}else{
			logToConsole()('Error Log: '+message);
		}
	}

	function errorLog(error, variables){
		var result = {};
		try{
			result.OriginalError=(error?error:'');
			result.Stringified=(error?JSON.stringify(error):'');
			result.Description=(error?error.description:'');
			result.Message=(error?error.message:'');
			result.Number=(error?error.number:'');
			result.Name=(error?error.name:'');
			result.Stack=(error?error.stack:'');
			result.Variables=variables;
			result.Day = new Date().toUTCString();
		}catch(Pokemon){
			say('Could not create log:\n'+Pokemon.stack);
		}
		return result;
	}

	function storeError(error, extraInfo){
		try{
			var logEntry = errorLog(error,extraInfo);
			var toInsert = [logEntry];
			sfSmartstore().upsertSoupEntries(SOUP_ERROR_LOG, toInsert,function(items){
				logToConsole()('Stored a new Error Log:\n'+JSON.stringify(logEntry));
			},function(fail){
				var receivedError = new errorLog(fail);
				logToConsole()('Could not store an error:\n'+JSON.stringify(receivedError));
			});
		}catch(Pokemon){
			logToConsole()('Could not store an error:\n'+Pokemon.stack);
		}
	}

	function deleteLogs(){
		try{
			sfSmartstore().clearSoup(SOUP_ERROR_LOG, function(){
				logToConsole()("Error Logs has been deleted")
			}, function(){
				say('Could not delete errorLogs');
			});
		}catch(Pokemon){
			say('Could not delete errorLogs');
			storeError(Pokemon);
		}
	}

	function handle(error, customMessage, extraInfo){
		try{
			storeError(error,extraInfo);
			if(customMessage !== undefined && customMessage !== null && customMessage !== ''){
				say(customMessage);
			}else{
				say(error.description);
			}
		}catch(Pokemon){
			say('Could not handle error');
			storeError(Pokemon);
		}
	}

	//public functions
	return{
		startDebugMode:startDebugMode,
		isDebug:isDebug,
		say:say,
		store:storeError,
		deleteLogs:deleteLogs,
		handle:handle
	};

}();