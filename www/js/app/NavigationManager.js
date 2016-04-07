/*
  @Author: Mathias , Juraj Ciljak, 
  @email:juraj.ciljak@accenture.com, 
  @Version: 1.0
  @LastModified: 19.04.2015; 
  @Description: Controller for handling pages and navigation
  @WARNING: 

*/

//Object for handling where the user is actually in the Tab, records ,....
var ActiveAppLocation = { PageName:"",TabName:"", PopUpName:"", RefreshTab:"" ,Record: {RecordId:"", ParenId:""}, Data:{}};

function changeCarouselNavigationTab(caller) {
	try{
		$( '.top-navigation-bar .navigation-tab' ).removeClass( 'active' );
		$( '.main-content-panel' ).removeClass( 'visible' );
		$( caller ).addClass( 'active' );

		var tab = $( '.top-navigation-bar .navigation-tab' ).first();
		while (!$( tab ).hasClass( 'active' )) {
			var nextTab = $( tab ).next();
			$( '.top-navigation-bar' ).append($( tab ));
			tab = nextTab;
		}
		var pageURL = $( '.navigation-tab.active' ).attr( 'pageUrl' );
		changePageContent(pageURL);
	}catch(err){
		storeExternalError(err,{"where":"changeCarouselNavigationTab","caller":caller});
	}
}

function changeSideNavigation(callerName){
	try{
		var caller = document.getElementById(callerName);
		hideSideMenu();
		changeCarouselNavigationTab(caller);
	}catch(err){
		storeExternalError(err,callerName);
	}
}

function changeNavigationTab(pageUrl){
	try{
		var Params;
		var recordId = getValueFromUrlParameters($.mobile.activePage.attr('data-url'), 'id');
		ActiveAppLocation.TabName = pageUrl;
		ActiveAppLocation.RefreshTab = false;
		ActiveAppLocation.Record.RecordId=recordId;
		ActiveAppLocation.Record.ParenId='';
		ActiveAppLocation.Data = {};
		switch(pageUrl.toLowerCase()){
			case "operations.html":
				ActiveAppLocation.PageName = PAGE_SERVICEORDER;
				Params = {Ids:[], RecordId : recordId,ParentId:"", SQL : "SQLITE_OPERATIONS", Page:""};
				Operations.OperationController(Params);
				break;
			case "workinghours.html":
				Params = {Ids:[], RecordId : recordId, ParentId:recordId, SQL : "SQLITE_INSTALLATIONS_RESOURCES", Page: "workinghours"};
				ActiveAppLocation.PageName = PAGE_SERVICEORDER;//SQL : "SQLITE_TIME_REPORT_DETAIL" //For new version of Time Regstration
				ActiveAppLocation.PopUpName = "";
				WorkHours.WorkHoursController(Params);
				break;
			case "details.html":
				ActiveAppLocation.PageName = PAGE_SERVICEORDER;
				Params = {Ids:[], RecordId : recordId, ParentId:"", SQL : "SQLITE_WORK_ORDER_DETAIL", Page:pageUrl};
				ServiceOrder.ServiceOrderController(Params);
				break;
			case "swr.html":
				Params = {RecordId : "",ParentId:recordId, SQL : "SQLITE_SWR"};
			 	SWRs.SwrController(Params);
				break;
			case "bulletins.html":
				Params = {RecordId : "",ParentId:recordId, SQL : "SQLITE_TKIC", FileType:"ASI"};
				TKICController.SelectedSubtypeValues = {"All Documents":"All Documents"};
				TKICController.SelectedEquipment = "";
			 	TKICController.Constructor(Params);
				break;
			case "manuals.html":
				Params = {RecordId : "",ParentId:recordId, SQL : "SQLITE_TKIC",FileType:"MAN"};
				TKICController.SelectedSubtypeValues = {"All Documents":"All Documents"};
				TKICController.SelectedEquipment = "";
			 	TKICController.Constructor(Params);
				break;
			case "spc.html":
				Params = {RecordId : "",ParentId:recordId, SQL : "SQLITE_TKIC",FileType:"SPC"};
				TKICController.SelectedSubtypeValues = {"All Documents":"All Documents"};
				TKICController.SelectedEquipment = "";
			 	TKICController.Constructor(Params);	 	
				break;			 
			case "work-safety.html":
				//JSA is selected
				WorkSafety.WorkSafetyController(recordId);
				break;
			case "incident.html":
				//Incident is selected
				Incidents.IncidentController(recordId);
				break;
			case "site-safety.html":
				//EHS conditions is selected
				SiteSafety.SiteSafetyController(recordId);
				break;
			default: 
				//page not defined
				break;
		}
	}
	catch(err){
		storeExternalError(err,{"Where":"changeNavigationTab","pageUrl":pageUrl});
	}
}

// Denis Ivancik 26.8.
//TODO: This needs to be disabled when a popup is open...
function NavigationSwipeLeft(){
	try{
		$( '.navigation-tab.active' ).removeClass( 'active' ).next().addClass( 'active' );
		$( '.top-navigation-bar' ).append($( '.top-navigation-bar .navigation-tab' ).first());
		var pageURL = $( '.navigation-tab.active' ).attr( 'pageUrl' );
		changePageContent(pageURL);
	}
	catch(err){
		storeExternalError(err,{"Where":"NavigationSwipeLeft"}); 
	}
}

// Denis Ivancik 26.8.
//TODO: This needs to be disabled when a popup is open...
function NavigationSwipeRight(){
	try{
		$('.top-navigation-bar').prepend($('.top-navigation-bar .navigation-tab').last());
		$('.navigation-tab.active').removeClass('active').prev().addClass('active');
		var pageURL = $('.navigation-tab.active').attr('pageUrl');
		changePageContent(pageURL);
	}
	catch(err){
		storeExternalError(err,{"Where":"NavigationSwipeRight"});
	}	
}

function initCarouselNavigation() {
	try{
		$( 'body' ).on( "swipeleft", function() {
			var openPopups = $(".ui-popup-active").length;
			var activePage = $( '.navigation-tab.active' ).attr( 'pageUrl' );
			// Denis Ivancik 26.8. Disable swipe effect on Documents tab
			if(activePage != "Documents.html" && activePage != "ServiceOrderPageLayout.html" && (openPopups === undefined || openPopups === 0)){
				NavigationSwipeLeft();
			}
		});
		$( 'body' ).on( "swiperight", function() {		
			var openPopups = $(".ui-popup-active").length;
			var activePage = $( '.navigation-tab.active' ).attr( 'pageUrl' );
			// Denis Ivancik 26.8. Disable swipe effect on Documents tab
			if(activePage != "Documents.html" && activePage != "ServiceOrderPageLayout.html" && (openPopups === undefined || openPopups === 0)){
				NavigationSwipeRight();
			}
		});
		// Denis Ivancik 26.8. adding swipe effect to some parts of Documents tab
		$( '.wartsila-carousel-nav-tab' ).on( "swipeleft",  function(event,data){
			event.stopImmediatePropagation();
			NavigationSwipeLeft();
		});
		$( '.wartsila-carousel-nav-tab' ).on( "swiperight", function(event,data){
			event.stopImmediatePropagation();
			NavigationSwipeRight();
		});
		EnableSwipe();
	}catch(err){
		storeExternalError(err,{"Where":"initCarouselNavigation"}); 
	}
}

function detachCarouselNavigation() {
	$('body').unbind("swipeleft");
	$('body').unbind("swiperight");
}

function changePageContent(pageUrl) {
	try{
		if(!pageUrl){
			return false;
		}
		$.get(pageUrl).success( function(html) {
			$('#detail-page-content-container').html(html);
		});

		//@Change: this should be better but for now i dont know which all parameter i would like to send by url
		//@Priority: change

		var userName =  "";
		if ((MainObject !== undefined) && ( MainObject !== null)){
			userName = MainObject.userData.Name;
		}
		$("#service_order_tag_userName").html("");
		$("#service_order_tag_userName").html(userName);
		$("#service_order_tag_userName").trigger( "create" );

		var recordId = getValueFromUrlParameters($.mobile.activePage.attr('data-url'), 'id');
		var wo_descr = getValueFromUrlParameters($.mobile.activePage.attr('data-url'), 'desc');
		if((wo_descr!==null) && (wo_descr!==undefined)){
			wo_descr = checkFieldValue(decodeURI(wo_descr),"string");
			$("#"+SERVICE_ORDER_TAG_DESC).html("");
			$("#"+SERVICE_ORDER_TAG_DESC).html(wo_descr);
			$("#"+SERVICE_ORDER_TAG_DESC).trigger( "create" );
		}
		var PassParams;
		switch(pageUrl.toLowerCase()){
			case "spareparts.html": 
				//Martin Opaterny 6/2/2015	
				PassParams = {Ids:[], RecordId : "",ParentId:recordId, SQL : "SQLITE_SPARE_PARTS_DETAILS", Page:"spareparts"};
			 	SpareParts.SparePartsController(PassParams);
				break;
			case "chat.html":
				PassParams = {Ids:[], RecordId : recordId, ParentId:recordId, SQL : "SQLITE_WO_CHATT", Page:"serviceorder"};
				Chatters.ChatterController(PassParams);
				break;
			case "serviceorderpagelayout.html":
				//tabs are loaded on the page
				//ServiceOrder.getServiceOrderTabs(recordId);
				break;
			case "riskassessment.html":
				//Riskassessment is loaded
				break;
			case "site.html":
				PassParams = {Ids:[], RecordId : recordId,ParentId:recordId, SQL : "SQLITE_SITEMAP", Page:"serviceorder"};
				SiteMaps.SiteMapController(PassParams);
				break;
			default:
				break;//page not defined
		}
	}
	catch(err){
		storeExternalError(err,{"Where":"changePageContent","pageUrl":pageUrl});
	}
}

function getValueFromUrlParameters(url, paramName){
	try{
		var urlParamsList = url.split('?')[1].split('&');
		for(var i = 0, j = urlParamsList.length; i < j; i++){
			var name = urlParamsList[i].split('=')[0];
			var value = urlParamsList[i].split('=')[1];
			if(name.toLowerCase() == paramName.toLowerCase()){
				return value;
			}
		}
		return null;
	}catch(err){
		storeExternalError(err,{"Where":"changePageContent","pageUrl":pageUrl});
	}
}

// Denis Ivancik - Since I disabled swiping on Documents.html
// I enabled it for elements containing class="swipeon"
function EnableSwipe(){
	try{
		$(".swipeon").on("swipeleft", function(event,data){
			event.stopImmediatePropagation();
			NavigationSwipeLeft();
		});	
		$(".swipeon").on("swiperight", function(event,data){
			event.stopImmediatePropagation();
			NavigationSwipeRight();
		});
		$(".swipe2download").on("swiperight", function(event,data){
			$(this).click(); //funny way how to activate downloading on swiping
		});
		$(".swipe2download").on("swipeleft", function(event,data){
			$(this).click(); //put switch on other side
		});
	}catch(err){
		storeExternalError(err,{"Where":"EnableSwipe"});
	}
}

function DisableSwipe(){
	$(".swipeoff").on( "swipeleft", function(){});
	$(".swipeoff").on( "swiperight", function(){});
}