# Homework 2: Visualization Dashboard: Layout Design + Visual Encoding
For homework 2, you will create a dashboard with three visualization views. This homework will not be using Observable. Instead, you will be developing a web-based interface in JavaScript with [D3.js](https://d3js.org/), where we have provided three templates.

To begin, you need to first fork this repository.
After the fork, clone the repository using the following commands:

```bash
  git clone https://github.com/<your-github-account-name>/ECS272-Fall2024
  cd ECS272-Fall2024/Homework2 
```
    
Create a new folder inside the Homework 2 directory in the forked repository. The name of the folder should be the same as your UC Davis email account name (without ' @ucdavis.edu'). **Inside this folder, you will add all your code.**

### Related to D3.js
For D3.js, please use version v6 or v7 (the latest). Versions earlier than v6 use very different and outdated syntax.\
Before coding, please go over the following tutorials. These should help you understand the fundamental behavior of D3.

* D3.js : [HTML & CSS & D3](https://d3-graph-gallery.com/intro_d3js.html), [Margin Convention](https://observablehq.com/@d3/margin-convention), [Selection](https://www.d3indepth.com/selections/), [Data Joins](https://www.d3indepth.com/datajoins/)

### Example
An example of visualization and analysis of a multidimensional dataset using D3.js can be found in [this Observable Notebook](https://observablehq.com/d/5313c1de57b3125c). We also provide a toy example in our templates.

---

## Step 0: Choose a Dataset from the Following List
In this assignment, you can choose one of the following datasets:

* [Financial Risk](https://www.kaggle.com/datasets/preethamgouda/financial-risk)
* [Olympic Games Paris 2024](https://www.kaggle.com/datasets/piterfm/paris-2024-olympic-summer-games/data)
* [Vehicle Sales](https://www.kaggle.com/datasets/syedanwarafridi/vehicle-sales-data)
* [Student Mental Health](https://www.kaggle.com/datasets/shariful07/student-mental-health)
* [Student Alcohol Consumption](https://www.kaggle.com/uciml/student-alcohol-consumption)

  
To use a dataset, download the data file from the respective URL above and put it in the `./<your-template>/data` folder.

## Step 1: Set Up the Environment
We have provided three templates; one in TypeScript using [Vue 3](https://vuejs.org/guide/introduction.html), one in TypeScript using [React](https://react.dev/learn), and the other in vanilla Javascript. All are built with the help of [Vite](https://vitejs.dev/guide/). You can find them and more technical details in `./Homework2/Vue-Template`, `./Homework2/React-Template`, and `./Homework2/VanillaJS-Template`.

Note that you are free to use JavaScript/TypeScript to implement your interface, while d3.js remains required for completing this assignment. \
If you have other preferences, you can choose a different setup so long as **it is [supported by Vite](https://vitejs.dev/guide/#trying-vite-online)**. 

### Which template should I use?
If you're new to JavaScript and want to build a solid foundation of web development, **vanilla JavaScript** could be a great choice. **However**, it is not so beginner-friendly when it comes to handling state changes, which is likely needed in HW3 or the final project. You would need to code event listeners, whereas other two abstract away much of the manual DOM manipulation (though this comes with their own learning curve). 

If you're interested in building interactive UIs with reusable components, you should consider Vue or React. Both provide higher-level abstractions that simplify creating interactive UIs and managing states. **However**, you will need to learn the fundamentals of these abstractions to use them effectively.
**React** has strong community support, is widely used in the industry, and offers great flexibility.
In contrast, **Vue** has simpler learning curve, making it a good choice for beginners.

Choose the one that aligns best with your learning goals and interests :\)

### Installation

Install [node.js](https://nodejs.org/en/) if not yet. <br />
Make sure the node.js version is either v14.18.0+ or v16.0.0+, which is **required** for Vite to work normally.

Both templates have the same setup process, as described below.

Install packages from package.json
```bash
  cd ./Vue-Template # Or ./React-Template or ./VanillaJS-Template, your choice.
  npm install
```
To start the application, run
```bash
  npm run dev
```
You can then visit `localhost:3000` in the browser to see the interface.

Install additional packages for your needs
```bash
  npm install <package-name>
```

\*These templates have been tested with Node.js v19.3.0.


# Requirements
Your task is to create a **static visualization dashboard**. 
As you design your dashboard, focus on the user experience and think carefully about the purpose of each view (e.g., why a user would want to see this view). 
Each visualization should present data effectively, and the design of this dashboard should facilitate the exploration of a dataset in an effective or interesting way.

* This dashboard must have three visualization views, each created with different visualization methods (see below).
* Your visualizations should include at least one advanced visualization method.
* Include **legends**, **axis labels**, and **chart titles** for each view. Axis labels and chart titles should be informative.
* Ensure all visualizations fit on **any** fullscreen browser (Hint: the template). 
* Consider where each view should be placed when designing the layout. 
* One of your three views should serve as an overview of the data.
* The visualizations should depict different dimensions or aspects of the dataset. 
* Choose appropriate visual encodings.
  * Carefully consider the design for each encoding and its effectiveness for portraying the data.  Depending on the data, certain pairings of marks and channels will be more effective.
  * Color choice matters and has an effect on the interpretability of the visualization. Depending on the data, the type of color scale you use can change (categorical, linear, diverging, etc.).
* **Your design choices and the rationale behind them will be part of the grading criteria.**
* Submit your dashboard as is. You can add comment on canvas if you wish to explain anything (although the dashboard should be self-explanatory), but there's no need to format your web app as a report. 

The design paradigm you will be following is referred to as focus + context. 

* Focus view displays the data of most interest (e.g., the selected region) in full detail.
* Context view provides an overview, where elements are displayed with less detail.

In HW3, you will provide one or more interactive widgets (e.g., a dropdown menu) for each view to facilitate user interaction with data. 
While the dashboard remains static in HW2, considering potential interactivity during the dashboard design will benefit HW3. Thinking about what actions users might want to take after seeing a view (such as drill downing or filtering/highlighting important patterns) can affect your design choices and enhance the user experience.

**Fundamental**
* Bar chart or histogram
* Pie or donut chart
* Line and area chart
* 2D heatmap or matrix view
* Scatter plot
* Node-link diagram
* Geographical map

**Advanced**
* Parallel set or parallel coordinates plot
* Sankey or alluvial diagram
* Star coordinates or plot
* Chord diagram
* Stream graph
* Arc diagram
* Dendrogram

### Example
Consider a dataset that collects information about wildfires in California. A dashboard of three views can be designed to support data exploration: (1) A map showing the locations of wildfires, with each point being a fire and its size indicates the total arceage burned; (2) A streamgraph that shows how the perimeter of top 5 worst fires evolved from the start until they was put out;
and (3) A heatmap showing how several weather variables (e.g., wind speed, temperature, and humiditiy) changed over the duration of those top 5 worst fires.

When considering potential interactivity, in one scenario, view (1) can be the overview and guides people to select fires based on the damage or a location of interest, and other two views provide more information of selected fires. 

# Submission
To submit for this assignment, you need to first [fork](https://docs.github.com/en/free-pro-team@latest/github/getting-started-with-github/fork-a-repo) this [repository](https://github.com/VIDITeaching/ECS272-Fall2023). After the fork, clone the forked repository using the following commands: 
```bash
  git clone https://github.com/<your-github-account-name>/ECS272-Fall2024
  cd ECS272-Fall2024/Homework2
```

Create a new folder inside the Homework 2 directory in the forked repository. The name of the folder should be the same as your UC Davis email account name (without ' @ucdavis.edu'). Put all your codes inside this folder, and use "git add" to add all your codes, and then commit. 
```bash
git add <your-filename> 
git commit -m "Homework2" 
git push
```
After you push your code to your repository, follow the instructions [here](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork) to create a pull request for this repository. Finally, submit the hyperlink of the pull request to UCD Canvas. The hyperlink should look like this- "https://github.com/VIDITeaching/ECS272-Fall2024/pull/{your-pull-request-id}".
