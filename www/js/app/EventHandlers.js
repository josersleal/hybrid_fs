$( document ).on( "pageshow", function(e) {
	console.log('pagechange event triggered!');
	console.log(e);
	console.log($.mobile.activePage.attr('data-url'));
	var pageUrl = $.mobile.activePage.attr('data-url');
	if (pageUrl.toLowerCase().indexOf('serviceorder.html') > -1) {
		//@Change @Warrning : here should be some check if the table is registered 
		Users.getCurrentUser(USER_CREDENTIALS.userId);
		initCarouselNavigation();
		var pageURL = $( '.navigation-tab.active' ).attr( 'pageUrl' );
		changePageContent(pageURL);
	}
	else {
		detachCarouselNavigation();
	}
});
/*********************************************/
/***** SUCCESS / ERROR HANDLER FUNCTIONS *****/
/*********************************************/
function getAuthCredentialsError(error) {
	cordova.require("com.salesforce.util.logger").logToConsole("getAuthCredentialsError: " + error);
}