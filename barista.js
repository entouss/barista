barista.js
Details
Activity
TODAY
E
Erik Toussaint uploaded an item
9:24 AM
Javascript
barista.js
No recorded activity before September 25, 2016

/*!
 * Barista.js
 * 
 * requires jQuery.js
 *
 * Author: Erik Toussaint
 */


/*
	Barista is a relatively simple Model/View/PubSub framework to generate "Views" using "Models", inside "Containers".
	Multiple "Views" can be subscribed to one "Model" and will re-render when the "Model" is explicitly published.
	
	Once JQuery and Barista are imported, call $(Barista.helloworld); or $(Barista.example); and inspect the code for more details.
*/
(function( module, $, undefined ) {
	//Module's public facing interface
	$.extend(module,{
		helloworld : function(){
			Barista.model('labels',{hello:'Hello'});
			Barista.model('who',{name:prompt('What is your name?','World')});
			Barista.view('hello',{
				render : function(models,$container) {
					var labels = models['labels'];
					var who = models['who'];
					return '<h1>'+labels.hello+' '+who.name+'!</h1>';
				}
			});
			Barista.view('hello').model('labels').model('who').container('body').render();
			setTimeout(function(){
				Barista.model('who',{name:'Universe'});
				Barista.publish('who');
			},5000);
		},
		example : function() {
			//Initialize Models and Views
			Barista.model('todoListModel',[														//Initialize todoListModel to [...] object
				{id:1,description:'item 1'},
			   	{id:2,description:'item 2'}
			]);
			Barista.view('todoListView',{														//Initialize todoListView
				render 		: function(models,$container) {										//At render time, models is a map built with identified models (i.e. todoListModel above) and/or anonymous model bound to the view (see further below)
					var title = models[''].title;												//Only one anonymous model is expected. If more than 1 is bound to the view, only the latest anonymous model will be considered.
					return 	'<section style="padding:10px;border:1px solid black;display:inline-block">'+
								'<h3>'+title+'</h3>'+
								'<ul></ul>'+
								'<button>+</button>'+
							'</section>'; 
				},
				onrendered 	: function(models,$container,$this) { 								//bind events or include other views here. $this refers to top most jquery element rendered (in this example, <section/>)
					var todoList = models['todoListModel'];
					for (var i = 0; i < todoList.length; i++) {
						var item = todoList[i];
						if (!item.deleted)
						Barista.view('todoListItemView').model(item).container($this.find('ul')).append().render(); //append() tells Barista not to clear previous render when re-rendering view
					}
					$this.find('button').click(function(){
						todoList.push({id:todoList.length+1,description:'item '+(todoList.length+1)});
						Barista.publish('todoListModel');										//Publishing a model this way also notifies all bound views to re-render
					});
				}
			});
			Barista.view('todoListItemView',{													//Initialize todoListItemView
				render 		: function(models,$container) { 									
				    var item = models[''];														
					return '<li>'+																//build and return html or jQuery using models
								'<input type="checkbox"'+(item.checked?' checked="checked"':'')+'/> '+
								(item.editable ? '<input type="text" value="'+item.description+'"/>' : ('<span>'+item.description+'</span>')) +
								' <a href="#">X</a>'+
						   '</li>'; 
				},
				onrendered 	: function(models,$container,$this) {
					var item = models[''];
					$this.find('input[type=checkbox]').click(function(){
						if (item.checked) { delete item.checked; } else { item.checked = true; }
						setTimeout(function(){
							Barista.publish('todoListView');									//Publishing a view notifies said view to re-render
						},100);
					});
					$this.find('span').click(function(){
						item.editable = true;
						setTimeout(function(){Barista.publish('todoListView');},100);
					});
					$this.find('a').click(function(){
						item.deleted = true;
						setTimeout(function(){Barista.publish('todoListView');},100);
						return false;
					});
					$this.find('input[type=text]').blur(function(){
						item.description = $(this).val();
						delete item.editable;
						setTimeout(function(){Barista.publish('todoListView');},100);
					}).focus();
				}
			});
			
			//Configure Models and Views and render
			Barista.view('todoListView').model('todoListModel').model({title:'Todo List'});		//Subscribe view to models including anonymous model
			Barista.view('todoListView').container('body').render();							//Render view inside 'selector' container
			//Can be chained together
			//	  Barista.view('todoListView').model('todoListModel').model({title:'Todo List'}).container('body').render();
			//aka Barista.coffee('todoListView').bean('todoListModel').bean({title:'Todo List'}).cup('body').brew();
			//    view=coffee, model=bean, container=cup, render=brew, onrendered=serve
		},
		
		
		
		
		
		
		
		
		component : function(type, id, obj, options) {
			options = options || {};
			if (obj != null) {
				var component = obj;
				if (type === 'view') {
					prototypes.viewAdjust(obj);
				}
				if (prototypes[type]) {
					$.extend(true, obj, prototypes[type]);
				}
				if (id) {
					if (!options.keepPrivate) {
						module.metadata(id,obj,options);
						//module.publish(id);
					}
					if (type != 'model') {
						component.id = id;
					}
				}
				return component;
			} else {
				var metadata = module.metadata(id);
				if (metadata) {
					var component = metadata.component;
					if (component._clone) {
						var _component = {};
						$.extend(true, _component, component);//clone
						delete _component.id;
						return _component;
					}
					return component;
				} else {
					console.error('Barista: No module "'+id+'" found');
				}
			}
			return null;
		},
		components : function(type, ids) {
			var components = {};
			ids.forEach(function(id) {
				components[id] = module.component(type, id);
			});
			return components;
		},
		view : function(id, obj, options) {
			return module.component('view',id,obj,options);
		},
		views : function(ids) {
			return module.components('view',ids);
		},
		model : function(id, obj, options) {
			return module.component('model',id,obj,options);
		},
		models : function(ids) {
			return module.components('model',ids);
		},
		metadata : function(id,component,options) {
			options = options || {};
			module.metadata = module.metadata || {};
			if (id != null) {
				if (component != null) {
					var metadata = module.metadata[id];
					if (metadata != null && !options['new']) {
						if (options.update) {
							$.extend(true, metadata.component, component);
						} else {
							metadata.component = component;
						}
					} else {
						module.metadata[id] = {
							registry : {},
							component : component
						};
					}
				}
				return module.metadata[id];
			}
			return module.metadata;
		},
		subscribe : function(registryId, componentId) {
			if (registryId != null && componentId != null) {
				var metadata = module.metadata(registryId);
				if (metadata) {
					metadata.registry[componentId] = componentId;
				}
			}
		},
		publish : function(id){
			metadata = module.metadata(id);
			var tcomponent = module.component(null,id);
			if (tcomponent != null) {
				if (tcomponent.render) {
					tcomponent.render();
				}
			} else {
				console.error('Barista: No module "'+id+'" found');
			}
			if (metadata != null && metadata.registry != null) {
				
				var tid;
				for (tid in metadata.registry) {
					var tcomponent = module.component(null,tid);
					if (tcomponent != null) {
						if (tcomponent.render) {
							tcomponent.render();
						} else {
							module.publish(tid);
						}
					}
				}
				
				/*metadata.registry.forEach(function(tid) {
					var tcomponent = module.component(null,tid);
					if (tcomponent != null) {
						if (tcomponent.render) {
							tcomponent.render();
						} else {
							module.publish(tid);
						}
					}	
				});*/
			}
		}
	});
	
	
	
	var prototypes = {};
	prototypes.view = {
		render : function(options) {
			options = options || {};
			model = options.model;
			container = options.container || this.container();
			append = options.append || this._append;
			
			if (!(container instanceof jQuery)) {
				container = $(container);
			}
			if (model == null) {
				var moduleModels = this.models();
				if (moduleModels != null) {
					model = {};
					var anonymousModel = null;
					for (var id in moduleModels) { 
						var moduleModel = moduleModels[id];
						if (moduleModel != null) {
							if (false && id === '') {
								anonymousModel = moduleModel;
							} else {
								model[id] = moduleModel;
							}
						}
					}
					if (anonymousModel != null) {
						$.extend(true, model, anonymousModel);
					}
				}
			}
			var html = null;
			var that = this;
			container.each(function(){
				var $container = $(this);
				if (that.renderString) {
					html = that.renderString(model, $container);
				}
				if (html != null) {
					$html = $(html);
					$html.addClass('barista').addClass(that.id);//viewId
					if (append) {
						$container.append($html);
					} else {
						$container.html($html);
					}
				}
			
				if (that.onrendered) {
					that.onrendered(model, $container, $html);
				}
				if (that.serve) {
					that.serve(model, $container, $html);
				}
			});
			return html;
		},
		models : function(ids) {
			if (!ids && this._models) {
				for (var key in this._models) {
					  if (this._models.hasOwnProperty(key)) {
						  ids = ids || [];
						  ids.push(key);
					  }
				}
				//ids = Object.keys(this._models);
			}
			var models = {};
			var _this = this;
			if (ids) {
				for (var i = 0; i < ids.length; i++) {
					var id = ids[i];
					models[id] = _this._model(id);
				};
			}
			return models;
		},
		_model : function(idOrModel, model) {
			if (model != null) {
				var moduleModel = module.model(idOrModel,model,{keepPrivate:true});
				if (this.id) {
					module.subscribe(idOrModel,this.id);
				}
				this._models = this._models || {};
				this._models[idOrModel] = moduleModel;
				return moduleModel;
			} else if (idOrModel != null){
				if (typeof idOrModel == 'string') {
					if (this._models != null && this._models[idOrModel] != null) {
						return this._models[idOrModel];
					} else {
						var moduleModel = module.model(idOrModel,model,{keepPrivate:true});
						if (this.id) {
							module.subscribe(idOrModel,this.id);
						}
						this._models = this._models || {};
						this._models[idOrModel] = null;//force it to go get model at global level each time
						return moduleModel;
					}
				} else {
					var moduleModel = module.model(null,idOrModel,{keepPrivate:true});
					this._models = this._models || {};
					this._models[''] = moduleModel;
					return moduleModel;
				}
			} 
			return this._models[''];
		},
		model : function(idOrModel, model) {//model(id,model), model(id), model(model), model()
			if (idOrModel != null || model != null) {
				this._model(idOrModel,model);
			} else {
				return this._models[''];
			}
			return this;
		},
		container : function(container) {
			if (container) {
				if (container instanceof jQuery) {
					this._container = container;
				} else {
					this._container = $(container);
				}
			} else {
				if (this._container != null && !(this._container instanceof jQuery)) {
					this._container = $(this._container);
				}
				return this._container;
			}
			return this;
		},
		append : function(bool) {
			if (bool != null) {
				this._append = bool;
			} else {
				this._append = true;
			}
			return this;
		},
		clone : function(bool) {
			if (bool != null) {
				this._clone = bool;
			} else {
				return $.extend(true, {}, this);//clone
			}
			return this;
		}
	};
	
	prototypes.viewAdjust = function(obj) {
		if (obj.render) {
			obj.renderString = obj.render;
			delete obj.render;
		}
		if (obj.container) {
			obj._container = obj.container;
			delete obj.container;
		}
		if (obj.append) {
			obj._append = obj.append;
			delete obj.append;
		}
		if (obj.clone) {
			obj._clone = obj.clone;
			delete obj.clone;
		}
		if (obj.brew) {
			obj.renderString = obj.brew;
			delete obj.brew;
		}
		if (obj.serve) {
			obj.onrendered = obj.serve;
			delete obj.serve;
		}
	};
	
	//Having a little coffee break
	module.bean = module.model;
	module.coffee = module.view;
	prototypes.view.brew = prototypes.view.render;
	prototypes.view.bean = prototypes.view.model;
	prototypes.view.beans = prototypes.view.models;
	prototypes.view.cup = prototypes.view.container;
	
	
}( window.Barista = window.Barista || {}, jQuery ));
