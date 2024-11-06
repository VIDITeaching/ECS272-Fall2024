# More about the Framework


This is a template in Vanilla JavaScript.


Here we give one example to explain why we say handling state changes is not that beginner-friendly in vanilla JavaScript. This likely happens in HW3 or final project.\
Consider a scenario where a parent component contains two child components that need to share data with each other.\
In vanilla JavaScript, one child has to pass up the value to the parent, and the parent then passes down the value to the other. This complicates everything when your app has more hierarchy.\
In React or Vue that has state management systems, they can provide a global state management store (refer to `/stores/` in each template), where the same communication can be achieved by each child interacting with the store to read or write the value. This is generally less error-prone and more straightforward.


## Files You Have to Care about

`package.json` is where we manage the libraries we installed. Besides this, most of the files you can ignore, but **the files under `./src/` are your concern**.

* `./src/app.js` is the root file for all **development** needs and is also where we manage the layout and load in components.
* `./src/components/` is where we create the components. You may have multiple components depends on your design.
  * `example.js` shows how to read `.csv` and `.json`, how component size is being watched, how a bar chart is created, and how the component updates if there are any changes. 
  * `notes.js` shows how to use Vuetify, and how a local state updates based on interaction.

## Libraries Installed in this Framework
 * D3.js v7 for visualization
 * [axios](https://axios-http.com/docs/intro) for API.
 * [materialize](https://materializecss.com/) for UI.
 * [lodash](https://lodash.com/) for utility functions in JavaScript.
