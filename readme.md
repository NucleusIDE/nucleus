# Nucleus

```sh
chmod ugo=+w /www/meteor
```


Nucleus is meant to be a bigger project, this package here is first attempt to implementing the meteor-only version of Nucleus. In this file all the references to **Nucleus** means this meteor-only version of it.  

## Vision 
With Nucleus, we are aiming to make the web writable. Web for most parts is free for reading to anyone, what we want to achieve it is make it writable as well. Nucleus aims to allow making web apps writable by masses.

## What it does?
Nucleus enables meteor apps to provide an interface to allow changing the source code of the app from within the web browser while providing modern tools for collaborative development.

## What it offers?
With nucleus you get controls to say have a **Make me with Nucleus** badge (like *Fork me on Github*) clicking on which users get a web based editor which has all the code for the web app. The code for the web app is obtained from git url which is provided in the configuration by the site owner.  
This editor has following tools:  
* **Realtime Development**  
  Multiple developers can edit in the same session and work in a Google docs like collaborative environment.  
* **Event Sync**  
  Nucleus allow developers to sync events with each other. Developers who enable this option in their Nucleus sessions get events from other developers (who has this option enabled) played in their browsers. That means when one developer clicks a button in their browser, it gets clicked in other developers' browsers too, same with form filling, route changing etc. 
* **Buddy follow**  
  Developers can follow other developers in Nucleus editor and see who is where in the app and what they are doing. This feature is great for those who are new to a project and want to see how the old developers working with the code etc. This feature can also be great for new developers to learn by seeing the pros working. 
* **Chat**  
  Of course a simplistic chat feature is present.
* **Web based terminal**  
  Nucleus uses `channikhabra:terminal` package for a simple web based terminal to allow sending commands to the web server hosting your nucleus enabled app.
* **Git controls**  
  Nucleus also has simple git controls for you to make commits and push changes to your github which you can then pull back on your HD to work locally.
* **One click deploy**  
  Nucleus uses `meteor-up` to allow one-click production deploy so you can deploy from within the Nucleus.

## WARNING
Nucleus is in very early stage. I am trying to keep it modular dividing it in multiple packages, and almost all of them are in their early stages. We haven't even started testing it yet. You are of course free to play with it, try locally or whatever. I have given you my warning, now go fuck with it :)

## How to use?

### Install
```sh
meteor add channikhabra:nucleus
```

### Configuration

Nucleus need be configured on both client and server.

### Client side configuration

```javascript
NucleusClient.configure({
  clientDir: 'client', 
  nucleusUrl: '/nucleus'
});
```
**clientDir**: It is preferred to keep your client code in "client" dir. We have planned a feature to live update client side code when developing nucleus. It's not implemented yet though.  
**nucleusUrl**: Using iron-router is a pre-requisite for using nucleus for now. This is the url where nucleus editor window will load. It's possible and easy to not have this requirement and simply open a popup with Nucleus,  

#### Opening the nucleus window
`nucleusUrl` setting is provided because at the moment we don't have any other authentication mechanism. I thought this way we can use iron-router's for prohibiting unwanted users from accessing nucleus. But you are not supposed to be using `nucleus` route directly. To open the nucleus window, have a badge or button or anything, and no user interacting, call `NucleusClient.initialize()`.

### Server side configuration

```javascript
    Nucleus.configure({
        project: 'test',
        git: '/Users/channi/Desktop/nucleus-demo/.git'
    });
    Nucleus.initialize();
```
* **project** : This is the name of the project under which this app will be cloned in `~/.nucleus/` directory
* **git**: This is the remote git url of your project. This url is cloned and source code is provided in nucleus editor for editing. Note that this same url is used to push changes back, so it's advised to put your auth creds here as for now nucleus doesn't have option to have different git creds for different users. We have login with github planned for a future phase, so this is a temporary hitch. 