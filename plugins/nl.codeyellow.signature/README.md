Cordova Signature View plugin
=============================

This plugin provides a simple "pad" for requesting a user's signature
which you can use in Cordova/Phonegap applications.  For efficiency
reasons, the pad is implemented natively where available (currently
only for Android).  A JavaScript fallback is provided for other
platforms, as well as for desktop browsers (for ease of testing).

This works best with an "active" pen, to get the most detailed output.
It captures normal "touch" events, so you could use it with a pressure
pen or fingers, but the results won't be as accurate.

In principle, you could use the plugin as a generic drawing/sketch
capturing system, but it provides no drawing "tools" of any kind.

Installation
------------

Simply add the plugin using the full path to the git repository:

	cordova plugin add https://bitbucket.org/codeyellow/cordova-plugin-signature-view.git

This should be done from the root directory of your Cordova project.

Usage
-----

This extension is a little strange in that it installs a file called
www/js/signature-view.js directly into your application.  You can load
this and it will provide the AMD module `cordova.signature-view`.  If
you want to test from your browser, try loading it from
`js/signature-view.js` and if that fails try loading from
`../plugins/nl.codeyellow.signature/www/js/signature-view.js`.
If you're not using an AMD loader, it will define a global SignatureView
variable (a property on "window").  It provides only one method, with
the following signature (no pun intended):

	:::javascript
	SignatureView.getSignature(success, error, [title, [htmlPage]]);

The `success` argument is a callback function accepting one argument,
which is either null (in case the user canceled the dialog) or an
[ImageData](http://www.w3.org/html/wg/drafts/2dcontext/html5_canvas/#imagedata)
object containing the raw binary image data.

The `error` argument is a callback function accepting one argument,
which is a string containing an error message indicating what went
wrong.

The `title` argument is an optional string which indicates what the
dialog should show as a heading.

The `htmlPage` argument is also an optional string which supplies a
full HTML page which will be presented in a webview above the
signature pad area.  This allows you to place salient parts about the
agreement just above the signature, which should help ensure that the
user knows what they're signing.  The base `www` directory is
configured as its base URI, so you can use assets from your
application.  See below for more details.

Beware when converting the image data to a data URI: some mobile
browsers (and IE) have length limitations on data URIs.  It's better
to use the image data with the canvas/2dcontext `putImageData` method
or something equivalent.

Example
-------

Here's a minimal working example.  It assumes there's a CANVAS element
in your HTML document which has an id of `signature`.

	:::javascript
	var Signature = cordova.require('nl.codeyellow.signature.Signature');
	Signature.getSignature(
		function (imgData) {
			/* This is the "success" callback. */
			if (!imgData) return; // User clicked cancel, we got no image data.
	
			var canvas = document.getElementById('signature'),
			ctx = canvas.getContext('2d');
			canvas.width = imgData.width;
			canvas.height = imgData.height;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.putImageData(imgData, 0, 0);
		}, function (msg) {
			/* This is the "error" callback. */
			alert('Could not obtain a signature due to an error: '+msg);
		},
		/* This final string is optional and defaults to a similar string. */
		'Please put your signature down below');

HTML page in signature view popup
---------------------------------

When showing a HTML page in your signature view popup, JavaScript is
available.  This plugin adds a `SignatureDialog` property to `window`,
which has two methods:

	:::javascript
	SignatureDialog.enableOkButton();
	SignatureDialog.disableOkButton();

These make the OK button clickable or unclickable, respectively.  This
can be used to force the user to explicitly agree with the stated
questions by ticking a checkbox, for example.  This may provide
additional legal certainty about the user's explicit consent.

In the Android version, these use the native `setEnabled()` method on
the button to mark it as enabled/disabled.

In the HTML fallback version, this will simply add 'enabled' or
'disabled' classes to the button and disable the event handler.
Initially the button is simply enabled.  You may want to add some
styling for feedback that the button is unclickable.