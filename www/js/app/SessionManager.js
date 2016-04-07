var forceClient;
var forcetkClient;
var USER_CREDENTIALS;

var SessionManages = new SessionManager();

function SessionManager(){

	"use strict";

	/* Adding platform (ios/android) specific css */
	var platformStyle = document.createElement('link');
	platformStyle.setAttribute('rel', 'stylesheet');
	if (/Android/.test(navigator.userAgent)){
		platformStyle.setAttribute('href', 'css/ratchet-theme-android.css');
	} 
	else if (/iPhone/.test(navigator.userAgent)){
		platformStyle.setAttribute('href', 'css/ratchet-theme-ios.css');
	}

	/* Wait until Cordova is ready to initiate the use of Cordova plugins and app launch */
	var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR); // Process bar
	ProcessBar.ProgressValue= 100; 
	document.addEventListener("deviceready", 
		function(){ 
			//TODO: Typo? cleanScreen?
			DataManager.cleanScreen();
			MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_INFO,TEXT_APPLICATION_INIT,ProcessBar,true); 
			MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_INFO,TEXT_APPLICATION_INIT,ProcessBar,true); 
			authenticateUser(showUsersList);
		}, false);

	/* Method to authenticate user with Salesforce Mobile SDK's OAuth Plugin */
	var authenticateUser = function(successHandler, errorHandler){
		// Get Salesforce mobile sdk OAuth plugin
		var oauthPlugin = cordova.require("com.salesforce.plugin.oauth"); 
		// Call getAuthCredentials to get the initial session credentials
		oauthPlugin.getAuthCredentials(
			// Callback method when authentication succeeds.
			salesforceSessionRefreshed,
			salesforceSessionRefreshedError
		);
	};

	/* This method will render a list of users from current Salesforce org */
	var showUsersList = function(forceClient){
		fetchRecords(forceClient, function(data){
			var users = data.records;
			var listItemsHtml = '';
			//document.querySelector('#users').innerHTML = listItemsHtml;
		});
	};

	/* This method will fetch a list of user records from Salesforce. 
	Just change the SOQL query to fetch another sObject. */

	var fetchRecords = function (forceClient, successHandler){
		var soql = 'SELECT Id, Name FROM User LIMIT 1';
		forceClient.query(soql, successHandler,
			function(error){
				alert('Failed connection to the Salesfroce: ' + error);
			}
		);
	};
}

function salesforceSessionRefreshedError(error){
	alert('Failed connection to the Salesforce: ' + error);
}

function salesforceSessionRefreshed(creds){
	try{
		//cordova.require("com.salesforce.util.logger").logToConsole("salesforceSessionRefreshed");
		FileManager.baseWindow = window;
		// if initzialization file system throw error then continue 
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
			function(fileSystem){
				gotFS(fileSystem);
				FileManager.isInitialized = true;
				FileManager.fSystem = fileSystem;
				MainObject.fsManager = FileManager;
			},
			function(fail){
				alert("Class SessionManager, callback function getAuthCredentials rise error  : " + JSON.stringify(fail));  
		});
		// Create forcetk client instance for rest API calls
		forceClient = new forcetk.Client(creds.clientId, creds.loginUrl);
		forceClient.setSessionToken(creds.accessToken, "v31.0", creds.instanceUrl);
		forceClient.setRefreshToken(creds.refreshToken);
		// Call success handler and handover the forcetkClient

		// Depending on how we come into this method, `creds` may be callback data from the auth
		// plug-in, or an event fired from the plug-in.  The data is different between the two.
		var credsData = creds;
		USER_CREDENTIALS = creds;
		userData.Id = credsData.userId;
		if (creds.data){
			// Event sets the `data` object with the auth data.
			credsData = creds.data;
		}
		forcetkClient = forceClient;
		forcetkClient.setUserAgentString(credsData.userAgent);
		MainObject.userData = jQuery.extend(true, {}, USER_DATA);
		MainObject.forcetkClient = forcetkClient;
		MainObject.fsManager = {};
		MainObject.userData =  userData;
		JobQueues.StartProcessList("onDeviceReady",VALUE_JOB_TYPE_MULTI);
	}
	catch(err){
		alert("SessionManager: " + err.message); 
	}
}