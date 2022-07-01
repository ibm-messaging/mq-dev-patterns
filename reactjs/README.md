# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app), by running `npx create-react-app mqapp`, using Node v14.18.0


## Application Basics

The application consists of a reactjs component `components\MQApp` that is added to a static web page via `index.js` and `App.js`. The component `MQApp`, after configuration, continously polls a web server for messages and displays the last 3 it found. The component makes use of the `serverless/codeengine` app found in this repository, as the web server it polls. 

## Available Scripts

To try the application on your own machine, navigate to the directory in where this README is. From here, you can run:

### `npm start`

This will runs the app in the development mode.\
Open [http://localhost:3000/mq-dev-patterns](http://localhost:3000/mq-dev-patterns) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.


### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.


### `npm run deploy`

This app has been configured so that is will deploy as a [git hub page](https://create-react-app.dev/docs/deployment/#github-pages). The steps involed are:
* Fork this repo
* Clone your fork to your laptop / desktop
* Modify the `homepage` value in `package.json` to point at your own forked repo.
* Run `npm run deploy` 

For example we have an instance of the app deployed [here](https://chughts.github.io/mq-dev-patterns/). You will need to specify the endpoint of your codeengine app, or any endpoint that is providing the required API the component is expecting.


### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
