/*
  @Author: Juraj Ciljak, 
  @email:juraj.ciljak@accenture.com, 
  @Version: 1.0
  @LastModified: 12.07.2015; 
  @Description: Controller for User page
  @WARNING: 
 
*/

var Users = new User();

function User(){

	var RecordId = "";
	var Parameters  = {};
	var PageDiv  =  DIV_USER_TAG;
	var CLASS_NAME ="User";	
	var isDeveloper = false;
	var devCounter = 1;
	var Data	= {};

	this.getData = function(data){
		try{
			if(data!==undefined){
				Data = data;
			}
		}
		catch(err){
			alert("Object "+CLASS_NAME+", method getData throw error:"+err.message);
		}
		return Data;
	};

	this.UserController = function(parameters){
		try{
			Users.ClearData();
			if(parameters!==undefined){
				Parameters = parameters;
				Users.getSmartStoreData();
			}
		}
		catch(err){
			alert("Object "+CLASS_NAME+", method OperationsController throw error:"+err.message);
		}
	};

	this.ClearData = function(){
		try{
			RecordId = "";
			Parameters = {};
		}
		catch(err){
			alert("Object "+CLASS_NAME+", method ClearData throw error:"+err.message);
		}
	};

	this.getSmartStoreData = function(){
		try{
			var SQL_PARAMS = SQLTable[Parameters.SQL];
			var iLimit = SQL_PARAMS.LIMIT;
			var Params = {Ids:[], VariableType : "String", ReplaceValue : ":RecordId", VariableValue : Parameters.RecordId};
			var WHERE = ReplaceSQLParameters(SQL_PARAMS.WHERE,Params);
			var QUERY = SQL_PARAMS.SQL+WHERE +SQL_PARAMS.ORDERBY;
			logToConsole()("SQLite for  [ " + QUERY +" ]");
			var querySpec = sfSmartstore().buildSmartQuerySpec(QUERY, iLimit);
				sfSmartstore().runSmartQuery(querySpec, function(cursor) {
				var page = cursor.currentPageOrderedEntries; 
				onSuccessSPDataRetrieve(page); 
			},function(error){
				logToConsole()("UserController received error from sfSmartstore:\n"+error);
			});
		} catch(err){
			alert("Object "+CLASS_NAME+", method getSmartStoreData throw error:"+err.message);
		}
	};

	function onSuccessSPDataRetrieve(response){
		try{
			$("#"+PageDiv).html("");
			var userName = '';
			for (var i = 0; i < response.length; i++){
				var entry = response[i];
				userName =entry[0].Name;
				MainObject.userData.Name = entry[0].Name;
				MainObject.userData.TimeZoneSidKey= entry[0].TimeZoneSidKey;
			}
	  		$("#p_tag_userName").html(userName);
			$("#"+PageDiv).trigger( "create" );
			if((Parameters.Parameters!==undefined) && (Parameters.JobLine!==undefined)){
				JobQueues.JobProcess(Parameters.Parameters,Parameters.JobLine);	
			}
		}
		catch(err){
			alert("Object "+CLASS_NAME+", method onSuccessSPDataRetrieve throw error:"+err.message);
		}
	}

	this.becomeDeveloper = function(){
		if(devCounter==7){
			document.getElementById("debugConsole").style.display = "block";
			document.getElementById("debugLogs").style.display = "block";
			document.getElementById("dummyError").style.display = "block";
			document.getElementById("externalError").style.display = "block";
			LOG.startDebugMode();
			devCounter++;
			alert("You became a developer!");
		}
		if(devCounter<7){
			devCounter++;
		}
	};

	this.getCurrentUser = function(Id){
		try
		{
			//@Change: not select whole _soup @Priority: must to change this
			var SOUP_SQL="Select {"+SOUP_USER_TABLE+":_soup} from {"+SOUP_USER_TABLE+"}";
			var WHERE="";
			var tab = "Records"; var detail = false; 

			if((Id!==null) && (Id!==''))
			{ 
				WHERE=" Where {"+SOUP_USER_TABLE+":Id} = '"+Id+"'";
				tab = "User_Detail";
				detail = true;
			}
			else{
				WHERE=" ";
			}
			logToConsole()("SQLite User" + SOUP_SQL+WHERE);
			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+WHERE, 1);
			sfSmartstore().runSmartQuery(querySpec, function(cursor) { 
				var page = cursor.currentPageOrderedEntries; 
				var entry ;
				var userName="";
				for (var i = 0; i < page.length; i++)  {
					entry = page[i];
					userName =entry[0].Name;
					MainObject.userData.Name = entry[0].Name;
					MainObject.userData.TimeZoneSidKey= entry[0].TimeZoneSidKey;
				}
				$("#p_tag_userName").html(userName);
				$("#p_tag_userName").trigger( "create" );
			});
		}
		catch(err){
			alert("UserController method getCurrentUser threw an error: " + err.message);
		}
	};

}