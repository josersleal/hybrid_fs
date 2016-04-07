/*
  @Authors: Juraj Ciljak:juraj.ciljak@accenture.com
  @Description: Object for handle which method should be run
  @Version:1.0
  @LastModify:
*/
var METHOD_PARAMETERS = { Parameters: { MethodRunner:""},RecordId:""};

var MethodsRunner = new MethodRunner();

function MethodRunner(){

	this.ProccessMethods = function(parameters){
		try{
			var ParamtereName = parameters.Parameters.MethodRunner;
			var recordId= parameters.RecordId;
			var Params;
			switch(ParamtereName){
				case "OperationPopUp":
					Operations.OperationPopUp(undefined,recordId);
					break;
				case "RefreshContent":
					Params = {Ids:[], RecordId : recordId,ParentId:"", SQL : "SQLITE_OPERATIONS", Page:""};
					Operations.OperationController(Params);
					break;
				case "RefreshWorkHours":
					Params = {Ids:[], RecordId : recordId, ParentId:recordId, SQL : "SQLITE_INSTALLATIONS_RESOURCES", Page:"workinghours"};
					WorkHours.WorkHoursController(Params);//SQL : "SQLITE_TIME_REPORT_DETAIL" //This is for new version of Time Registration
					break;
				case "getSmartStoreServiceOrder" :
					DataManager.getSmartStoreServiceOrder('');
					break;
				case "getCurrentUser":
					Users.getCurrentUser(MainObject.userData.Id);
					JobQueues.InitJobProcess(0,0,false,0);// reset Offset
					break;
				case METHOD_REFRESH_SERVICE_CHATTER_TAB:
					recordId =  parameters.ParentId;
					Params = {Ids:[], RecordId : recordId, ParentId:recordId, SQL : "SQLITE_WO_CHATT", Page:"serviceorder"};
					Chatters.ChatterController(Params);
					break;
				default:
					break;
			}
		}
		catch(err){
			LOG.store(err,{"Where":"MethodManager - ProccessMethods","parameters":parameters});
		}
	};

	this.ProccessMethodsJob = function(parameters){
		try{
			var ParamtereName = parameters.MethodManager;
			//var recordId="";
			switch(ParamtereName){
				case "getSmartStoreServiceOrder" :
					DataManager.getSmartStoreServiceOrder('');
					break;
				case "getCurrentUser":
					Users.getCurrentUser(MainObject.userData.Id);
					break;
				case "checkDownloadedTKIC":
					TKICController.checkDownloadedTKICs();
					break;
				case "checkDownloadedSWR":
					SWRs.checkDownloadedSWRs();
					break;
				default:
					break;
			}
		}
		catch(err){
			LOG.store(err,{"Where":"MethodManager - ProccessMethodsJob","parameters":parameters});
		}
	};

}