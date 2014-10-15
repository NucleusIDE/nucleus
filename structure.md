# Code structure

This is very initial version of nucleus and code structure might need refactoring. Till now, objective was to quickly get to the working-version as soon as possible.

Note that we use similar app structure as regular meteor apps in nucleus package, but meteor doesn't interact with packages the same way it does with the apps. The directory structure by itself has no meaning to the app, and which files are loaded where and in which order is marked in `package.js` file.  Code is broadly divided into three directories:

* **global_overrides.js**  
  This code must be executed prior to any other on client. It contains (as of yet) the overrides for meteor's core methods (`Collection.insert`)  

* **client**  
  This directory contains code that should be used on client side.
  * **eventsync**  
    This directory contains code which does the event sync. Most of this code is ported from [browser-sync-client](https://github.com/shakyShane/browser-sync-client)
      * **nucleus_event_manager.js**  
        Creates `NucleusEventManager` which is the centralized place to handle events.
      * **utils.js**  
        Utilities required for managing events. Ported from [browser-sync-client](https://github.com/shakyShane/browser-sync-client)
      * **clicks.js**                
        Sync click events. 
      * **form_submit.js**           
        Sync form submit.
      * **form_inputs.js**           
        Sync form input events.
      * **form_toggles.js**          
        Sync form toggle events i.e check-box, radio button and select toggle.
      * **forms.js**             
        Centralized place for all form events.
      * **login.js**                 
        Sync login and logout events.
      * **scroll.js**
        Sync scroll events.
      * **location.js**              
        Sync route change.      
  * **lib**  
    External libraries
  * nucleus.js  
    Here we define `NucleusClient` which has all the methods required for interaction with `Nuclues` on the client.
  * nucleus_editor.js  
    It is an abstraction over the sharejs-ace editor for centralizing interaction with the editor. 
  * nucleus_sidebar.js   
    Centralizing the control and interaction with the sidebar. It mostly contains code for handling the file-tree.
  * template.css
    Styles for templates.
  * template.html
    All the templates are in single file for now. 
  * template.js  
    All the helpers and events on the templates. It also contains the autoruns for updating the currently editing file, user status boxes etc. Of course these need to be put in their own file or something.
* **server**  
  Code to be used on server.
  * nucleus.js  
    It defines `Nucleus` on server and provide all needed methods for interacting with the filesystem on server like getting cloning the git url, saving file, getting file contents for editing etc.
  * permissions.js  
    Most users have `insecure` package removed, so we have to provide `allow` rules for collections we explicitly create.
  * methods.js  
    In meteor, methods are the easiest way of interaction b/w client and server. Most of these methods are simply proxies for functions in `Nucleus` and which are not should be moved to `Nucleus` on next refactoring.
* **both**  
  Code to be used both on server and client.
  * models  
    Here we define the collections and models which we need for working with nucleus. We use `channikhabra:stupid-models` package for creating models.
    * nucleus_event_model.js  
      This models/collection is for storing/broadcasting events to all the connected clients. 
    * nucleus_user.js  
      We don't user meteor's users for identifying people on nucleus. We have our own simplistic version of users which don't need signup etc. Users are identified with their nicks and are destroyed as soon as they close the window.
  * collections.js  
    This file creates collections for the mongo collections which are not created within the Nucleus. These are mainly sharejs `docs` and `ops` collections, and a `nucleus_documents` collection we create for keeping track of docs in `docs`.
  * utilities.js  
    Utilities which can be used on both client and server.
  
* **chat**  
  This directory contains the implementation of simplistic chat feature we use in nucleus. This is to be moved to its own package, but it relies on `NucleusUser` so it is sitting in here. When we move nucleus to better user system (possibly login with github), this shall be moved to its own package. 

* **docs**  
  Documentation







