/*
 * jQuery SuperBox! 0.9.3
 * Copyright (c) 2009 Pierre Bertet (pierrebertet.net)
 * Licensed under the MIT (MIT-LICENSE.txt)
 *
 * TODO :
 * - Document.load if init is before </body> against IE crash.
 * - Animations
 * - Image / Gallery mode : display a legend
*/
"use strict";
(function($) {
	
	// Local variables
	var $curLink, $overlay, $wrapper, $container, $superbox, $closeBtn, $loading, $nextprev, $nextBtn, $prevBtn, settings, $innerbox, $closeElts,
	
	// Default settings
	defaultSettings = {
		boxId: "superbox",
		boxClasses: "",
		overlayOpacity: 0.8,
		boxWidth: "600",
		boxHeight: "400",
		loadTxt: "Loading...",
		closeTxt: "Close",
		prevTxt: "Previous",
		nextTxt: "Next",
		overlayClose: true,
		beforeOpen: function(){},
		afterOpen: function(){}
	},
	
	galleryGroups = {},
	galleryMode = false,
	hideElts = $([]),
	isWaiting = false;
	
	// Init dispatcher
	$.superbox = function() {
		
		// Settings
		settings = $.extend({}, defaultSettings, $.superbox.settings);
		
		// If IE6, select elements to hide
		if ($.browser.msie && $.browser.version < 7) {
			hideElts = hideElts.add("select");
		}
		
		// Do not init SuperBox! twice
		if ($.superbox.mainInit !== true) {
			
			// Create base elements
			createElements();
			
			// Init global events (left / right, echap)
			initGlobalEvents();
			
			$.superbox.mainInit = true;
		}
		
		// Dispatch types
		dispatch();
	};
	
	// Dispatch types
	function dispatch() {
		
		// Match all superbox links
		$("a[rel^=superbox],area[rel^=superbox]").each(function() {
			
			// Optimisation
			var $this = $(this),
			relAttr = $this.attr("rel"),
			
			// Match first argument. Ex: superbox[gallery#my_id.my_class][my_gallery] > gallery#my_id.my_class
			firstArg = relAttr.match(/^superbox\[([^\]]+)\]/)[1],
			
			// Match type. Ex: superbox[gallery#my_id.my_class][my_gallery] > gallery
			type = firstArg.match(/^([^#\.]+)/)[1],
			
			// Match additionnal classes or IDs (#xxx.yyy.zzz)
			boxCurrentAttrs = firstArg.replace(type, "").match(/([#\.][^#\.\]]+)/g) || [],
			
			// Box ID and classes
			newBoxId = settings.boxId,
			newBoxClasses = settings.boxClasses;
			
			// Prevent multiple inits
			if ($this.data("superbox_init")) { return; }
			$this.data("superbox_init", true);
			
			// Additionnal rel settings
			this._relSettings = relAttr.replace("superbox["+ type + boxCurrentAttrs.join("") +"]", "");
			
			// Redefine settings
			$.each(boxCurrentAttrs, function(i, val) { // each class or id
				if (val.substr(0,1) == "#") {
					newBoxId = val.substr(1);
					
				} else if (val.substr(0,1) == ".") {
					newBoxClasses += " " + val.substr(1);
				}
			});
			
			// Call type method
			if (type.search(/^image|gallery|iframe|content|ajax$/) != -1) {
				$this.superbox(type, {boxId: newBoxId, boxClasses: newBoxClasses});
			}
		});
	}
	
	/*-- Superbox Method --*/
	$.fn.superbox = function(type, curSettings) {
		curSettings = $.extend({}, settings, curSettings);
		$.superbox[type](this, curSettings);
		
		this.click(function(e) {
			e.preventDefault();
			$curLink = this;
		});
	};
	
	/*-- Types --*/
	$.extend($.superbox, {
		
		// Wait... (loading)
		wait: function(callback) {
			
			isWaiting = true;
			
			prepareBox();
			
			// Loading anim
			initLoading(function() {
				
				// Execute callback after animation
				callback();
			});
		},
		
		// Custom SuperBox!
		open: function(content, curSettings) {
			
			curSettings = $.extend({}, settings, curSettings);
			
			// Launch load animation
			if (!isWaiting) {
				$.superbox.wait(function(){
					$.superbox.open(content, curSettings);
				});
				return;
			}
		
			// Specified dimensions
			$superbox.width( curSettings.boxWidth+"px" );
			if ( curSettings.boxHeight == 'auto' || curSettings.boxHeight == '-1' ) {
				$innerbox.height('auto');
			} else {
				$innerbox.height( curSettings.boxHeight+"px" );
			}
			
			// Set Id and Classes
			$superbox.attr("id", curSettings.boxId).attr("class", curSettings.boxClasses);
			
			// Append content
			$(content).appendTo($innerbox);
			
			// Show box
			showBox(curSettings);
			
			// Stop waiting
			isWaiting = false;
		},
		
		// Close SuperBox!
		close: function() {
			
			hideBox();
			$overlay.fadeOut(300, function() {
				
				// Show hidden elements for IE6
				hideElts.show();
			});
			galleryMode = false;
			$innerbox.height('auto');
		},
		
		// Image
		image: function($elt, curSettings, isGallery) {
			
			// On click event
			$elt.click(function() {
				
				galleryMode = !!isGallery;
				
				$.superbox.wait(function() {
					
					var relSettings = getRelSettings($elt.get(0)),
					dimensions = false;
					
					// Extra settings
					if (!!relSettings) {
						
						var relDimensions;
						
						if (galleryMode) { 
							relDimensions = relSettings[1];
						} else {
							relDimensions = relSettings[0];
						}

						if (!!relDimensions) {
							dimensions = relDimensions.split("x");
						}
					}
					
					// Image
					var $curImg = $('<img src="'+ $elt.attr("href") +'" title="'+ ($elt.attr("title") || $elt.text()) +'" />');
					
					// On image load
					$curImg.load(function() {
						var boxWidth, boxHeight;
						
						// Image box dimensions
						if (!!dimensions && dimensions[0] !== "") {
							boxWidth = dimensions[0] - 0;
						} else {
							// image width + $innerbox padding
							boxWidth = $curImg.width() + ($innerbox.css("paddingLeft").slice(0,-2)-0) + ($innerbox.css("paddingRight").slice(0,-2)-0);
						}
						if (!!dimensions && dimensions[1] !== "") {
							boxHeight = dimensions[1] - 0;
						} else {
							boxHeight = $curImg.height();
						}
						
						curSettings = $.extend({}, curSettings, {
							boxClasses: (galleryMode? "gallery " : "image ") + curSettings.boxClasses,
							boxWidth: boxWidth,
							boxHeight: 'auto',
							beforeOpen: function() {
								if (galleryMode) {
									// "Prev / Next" buttons
									nextPrev($elt, relSettings[0]);
								}
							}
						});
						
						// Open SuperBox!
						$.superbox.open($curImg, curSettings);
					});
					
					// Append image to SuperBox! (to trigger loading)
					$curImg.appendTo($innerbox);
				});
				
			});
		},
		
		// Gallery
		gallery: function($elt, curSettings) {
			
			// Extra settings
			var extraSettings = getRelSettings($elt.get(0));
			
			// Create group
			if(!galleryGroups[extraSettings[0]]) {
				galleryGroups[extraSettings[0]] = [];
			}
			
			// Test if the large image is already in the gallery
			for (var i=0; i < galleryGroups[extraSettings[0]].length; i++) {
				if (galleryGroups[extraSettings[0]][i][0].href === $elt[0].href) {
					$elt.click(function(){
						galleryGroups[extraSettings[0]][i].click();
					});
					return;
				}
			};
			
			// Add element to current group
			galleryGroups[extraSettings[0]].push($elt);
			
			$elt.data("superboxGroupKey", galleryGroups[extraSettings[0]].length - 1);
			
			// Image Box
			$.superbox['image']($elt, curSettings, true);
		},
		
		// iframe
		iframe: function($elt, curSettings) {
			
			// On click event
			$elt.click(function() {
				
				$.superbox.wait(function() {
					
					// Extra settings
					var extraSettings = getRelSettings($elt.get(0));
					
					// Dimensions
					var dims = false;
					if (extraSettings) {
						dims = extraSettings[0].split("x");
					}
					
					curSettings = $.extend({}, curSettings, {
						boxWidth: dims[0] || curSettings.boxWidth,
						boxHeight: dims[1] || curSettings.boxHeight,
						boxClasses: "iframe " + curSettings.boxClasses
					});
					
					// iframe element
					var $iframe = $('<iframe title="'+ $elt.text() +'" src="'+ $elt.attr("href") +'" name="'+ $elt.attr("href") +'" frameborder="0" scrolling="auto" width="'+ curSettings.boxWidth +'" height="'+ curSettings.boxHeight +'"></iframe>');
					
					// On iframe load
					$iframe.one("load", function() {
						
						// Open SuperBox!
						$.superbox.open($iframe, curSettings);
					});
					
					// Append iframe to SuperBox! (to trigger loading)
					$iframe.appendTo($innerbox);
				});
				
			});
		},
		
		// Content
		content: function($elt, curSettings) {
			
			// On click event
			$elt.click(function() {
				
				$.superbox.wait(function() {
					var elt_href = $elt.attr('href');
					
					curSettings.boxWidth = $(elt_href).width();
					curSettings.boxHeight = $(elt_href).height();
					
					// Extra settings
					var extraSettings = getRelSettings($elt.get(0));
					
					// Dimensions
					var dims = false;
					if (extraSettings) {
						dims = extraSettings[0].split("x");
					}
					
					// Get cloned elt height
					if (dims[1]==="") {curSettings.boxHeight="";}

					// Specific settings
					curSettings = $.extend({}, curSettings, {
						boxWidth: dims[0] || curSettings.boxWidth,
						boxHeight: dims[1] || curSettings.boxHeight,
						boxClasses: "content " + curSettings.boxClasses
					});

					// Open SuperBox!
					$.superbox.open($(elt_href).clone(), curSettings);
					$('#' + curSettings.boxId).find(elt_href).show();
				});
				
			});
		},
		
		// Ajax
		ajax: function($elt, curSettings) {
			
			// On click event
			$elt.click(function() {
				
				$.superbox.wait(function() {
					
					// Extra settings
					var extraSettings = getRelSettings($elt.get(0));
					
					// Dimensions
					var dims = false;
					if (extraSettings && extraSettings[1]) {
						dims = extraSettings[1].split("x");
					}
					
					// Extend default dimension settings
					curSettings = $.extend({}, curSettings, {
						boxWidth: dims[0] || curSettings.boxWidth,
						boxHeight: dims[1] || curSettings.boxHeight,
						boxClasses: "ajax " + curSettings.boxClasses
					});
					
					// Get Ajax URL + ID
					var splitUrl = extraSettings[0].split("#");
					var ajaxUrl = splitUrl[0];
					var anchor = splitUrl[1] || false;
					
					$.get( ajaxUrl, function(data) {
						
						// Get a specific element (by ID)?
						if (anchor !== false) {
							data = $(data).find("#" + anchor);
							if (data.length === 0) {
								data = $(data).filter("#" + anchor);
							}
						}
						
						// Open SuperBox!
						$.superbox.open(data, curSettings);
					});
				});
			});
		}
	});
	
	// Get extra settings in rel attribute
	function getRelSettings(elt) {
		return elt._relSettings.match(/([^\[\]]+)/g);
	}
	
	// Next / Previous
	function nextPrev($elt, group) {
		
		$nextprev.show();
		
		galleryMode = true;
		
		var nextKey = $elt.data("superboxGroupKey") + 1,
			prevKey = nextKey - 2;
		
		// Next
		if (galleryGroups[group][nextKey]) {
			$nextBtn.removeClass("disabled").unbind("click").bind("click", function() {
				galleryGroups[group][nextKey].click();
			});
			
		} else {
			$nextBtn.addClass("disabled").unbind("click");
		}
		
		// Prev
		if (galleryGroups[group][prevKey]) {
			$prevBtn.removeClass("disabled").unbind("click").bind("click", function() {
				galleryGroups[group][prevKey].click();
			});
			
		} else {
			$prevBtn.addClass("disabled").unbind("click");
		}
		
		// Keys shortcuts
		$(document)
			.unbind("keydown.superbox_np")
			.bind("keydown.superbox_np", function(e) {
				
				// Left/right arrows
				if (e.keyCode == 39) {
					$nextBtn.click();
				
				} else if (e.keyCode == 37) {
					$prevBtn.click();
				}
			});
	}
	
	// Hide Box
	function hideBox() {
		
		/* creates errors in IE.
		if (!!$curLink) {
			$curLink.focus();
		}*/
		
		$(document).unbind("keydown.spbx_close").unbind("keydown.superbox_np");
		$loading.hide();
		$nextprev.hide();
		$wrapper.hide().css({position: "fixed", top: 0});
		$innerbox.empty();
		$curLink = null;
	}
	
	// "Loading..."
	function initLoading(callback) {
		
		// Keys shortcuts
		$(document)
			.unbind("keydown.spbx_close")
			.bind("keydown.spbx_close",function(e) {
				
				// Escape
				if (e.keyCode == 27) {
					$.superbox.close();
				}
			});
		
		var loading = function() {
			
			// IE6
			if($.browser.msie && $.browser.version < 7) {
				$wrapper.css({position: "absolute", top:"50%"});
			}
			
			// Hide elements for IE6
			hideElts.hide();
			
			$loading.show();
			callback();
		};
		
		if (galleryMode) {
			$overlay.css("opacity", settings.overlayOpacity).show();
			loading();
		}
		else {
			$overlay.css("opacity", 0).show().fadeTo(300, settings.overlayOpacity, loading);
		}
	}
	
	// "Prepare" box : Show $superbox with top:-99999px;
	function prepareBox() {
		$wrapper.show();
		$innerbox.empty();
		$superbox.css({position: "absolute", top: "-99999px"});
	}
	
	// Display box
	function showBox(curSettings) {
		
		curSettings = $.extend({}, settings, curSettings);
		
		// Stop "Loading..."
		$loading.hide();
		
		// Show $superbox
		$superbox.css({position: "static", top: 0, opacity: 0});
		
		// IE6 and IE7
		if ($.browser.msie && $.browser.version < 8) {
			$superbox.css({position: "relative", top:"-50%"});
			
			// IE6
			if ($.browser.msie && $.browser.version < 7) {
				$wrapper.css({position: "absolute", top:"50%"});
			}
		}
		
		// Position absolute if image height > window height
		if ( $(window).height() < $wrapper.height() ) {
			$wrapper.css({position: "absolute", top: ($wrapper.offset().top + 10) + "px"});
		}
		
		curSettings.beforeOpen();
		
		$superbox.fadeTo(300, 1, function(){
			curSettings.afterOpen();
		}).focus();
	}
	
	// Create base elements (overlay, wrapper, box, loading)
	function createElements() {
		var $closeElts;
		// Overlay (background)
		$overlay = $('<div id="superbox-overlay"/>').appendTo("body").hide();
		
		// Wrapper
		$wrapper = $('<div id="superbox-wrapper"/>').appendTo("body").hide();
		
		// Box container
		$container = $('<div id="superbox-container"/>').appendTo($wrapper);
		
		// Box
		$superbox = $('<div id="superbox" tabindex="0"/>').appendTo($container);
		
		// Inner box
		$innerbox = $('<div id="superbox-innerbox"/>').appendTo($superbox);
		
		// "Next / Previous"
		$nextprev = $('<p class="nextprev"/>').appendTo($superbox).hide();
		$prevBtn = $('<a class="prev" tabindex="0" role="button"><strong><span>'+ settings.prevTxt +'</span></strong></a>').appendTo($nextprev);
		$nextBtn = $('<a class="next" tabindex="0" role="button"><strong><span>'+ settings.nextTxt +'</span></strong></a>').appendTo($nextprev);
		
		// Add close button
		$closeBtn = $('<p class="close"><a tabindex="0" role="button"><strong><span>'+ settings.closeTxt +'</span></strong></a></p>').prependTo($superbox).find("a");
		
		// "Loading..."
		$loading = $('<p class="loading">'+ settings.loadTxt +'</p>').appendTo($container).hide();
	}
	
	// Init global events : close (echap), keyboard access (focus + enter)
	function initGlobalEvents() {
		
		// Hide on click
		if (settings.overlayClose) {
			$closeElts = $overlay.add($wrapper).add($closeBtn);
		} else {
			$closeElts = $closeBtn;
		}
		
		$closeElts.click(function() { $.superbox.close(); });
		
		// Remove "hide on click" on superbox
		$superbox.click(function(e) {
			e.stopPropagation();
		});
		
		// Opera already click on "focus + enter"
		if (!window.opera) {
			
			// Keyboard (focus + enter)
			$prevBtn.add($closeBtn).add($nextBtn).keypress(function(e) {
				if (e.keyCode === 13) {
					$(this).click();
				}
			});
		}
	}
	
})(jQuery);