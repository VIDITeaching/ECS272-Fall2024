# Homework 3:  Visualization Dashboard Pt 2 (Interactivity)
For Homework 3, you will be extending your Homework 2 dashboard to include interactions and animated transitions. **You may start fresh, i.e., selecting different datasets from HW2 or designing different visualizations.**
Still, you will use JavaScript/TypeScript with [D3.js](https://d3js.org/).

## Resources

To implement interactions in your own visualizations, you may find the following links useful:
* [Event handling in D3.js](https://gramener.github.io/d3js-playbook/events.html) (Note: syntax is slightly different since this is old D3.js)
* [Mouse events](https://observablehq.com/@d3/multitouch)
* [d3-drag](https://github.com/d3/d3-drag), [d3-zoom](https://github.com/d3/d3-zoom), [d3-brush](https://github.com/d3/d3-brush)
* Demos for the use of [d3-drag](https://bl.ocks.org/mbostock/22994cc97fefaeede0d861e6815a847e), [d3-zoom](https://observablehq.com/@d3/zoomable-bar-chart), [d3-brush](https://observablehq.com/@d3/brushable-scatterplot)

These are some tutorials and explanations for using Animation and Transitions with D3.js
* [d3 animation](https://observablehq.com/@d3/learn-d3-animation)
* [d3 animation and transitions](https://observablehq.com/@cesandoval/week-12-interaction-and-animation-d3-transitions-behavior)
* [Another transition example](https://www.d3indepth.com/transitions/)

Animations can help users see transitions from one state to the next and enable them to more easily track changes as parts of the visualizations move from one point to another.

---

The following are types of transitions between data graphics:

* **View Transition** - This involves changing the viewpoint, similar to moving a camera through virtual space. Examples include zooming in and out or panning across the display.
* **Substrate Transformation** - These transitions alter the spatial framework in which data marks are embedded. Examples include rescaling axes, applying logarithmic transforms, or using visual effects like bifocal and fisheye distortions.
* **Filtering** - Using a condition to determine which elements are visible. It involves adding or removing items from the display based on specific criteria. Filtering doesn’t change data encodings or the data schema, although axes might need to be rescaled.
* **Ordering** -  These transitions rearrange data based on ordinal dimensions. Examples include sorting items by attribute values or manually reordering them.
* **Timestep** - This transition applies changes over time to data values. It involves updating the data to reflect different points in time without changing the overall data structure or schema.
* **Visualization Change** -   This involves altering the visual representation of data. For instance, switching from a bar chart to a pie chart, or adjusting color, size, or shape encodings.
* **Data Schema Change** -  This transition changes the data dimensions being visualized. For example, moving from a univariate graph (displaying a single variable like age) to a bivariate graph (displaying two variables, such as age and height). This often requires changes to the visual mappings, as the new graph could be presented as a stacked bar chart, scatterplot, or other formats.

---

Some design considerations to make before crafting your animated transitions:

* Maintain valid data graphics during transitions. 
  * Avoid uninformative animation, and consider the relationship between axes and the data marks during any changes.
* Use consistent semantic-syntactic mappings.
  * To enhance understanding, similar actions should have similar animations across different types of data visualizations. For example, if a fade animation is used to filter items in one view, the same fade animation should be applied in other views that also filter items. Consistency is crucial for maintaining clarity.
* Respect semantic correspondence.
  * Data points should consistently represent the same information throughout transitions. Do not reuse graphical marks to depict different data points, as this can cause confusion.
* Avoid ambiguity.
* Group similar transitions.
  * The Gestalt principle of Common Fate states that elements that undergo similar visual changes are more likely perceived as related. Grouping similar transitions can help viewers understand that these elements are part of the same operation.
* Minimize occlusion.
  * Avoid situations where objects overlap and block each other during transitions, as this can make it difficult for viewers to track changes and understand the data.
* Maximize predictability.
  * Transitions should be predictable and easy to follow. Using slow-in, slow-out timing (where animations start slowly, speed up, and then slow down again) helps emphasize the beginning and end states and improves the predictability of movements.
* Use simple transitions.
  * Complicated transforms with unpredictable motion paths or multiple simultaneous changes result in increased cognitive load.  Keep transitions simple and direct.
* Use staging for complex transitions.
  * When a complex transition is necessary, break it into smaller, simpler sub-transitions. This allows viewers to follow each change more easily. For example, separating axis rescaling from data value changes can help maintain clarity.
* Make transitions as long as needed, but no longer.
  * Transitions should be long enough to allow viewers to accurately track changes, but not so long that they become tedious or disengaging. Finding the right balance is key to maintaining viewer interest and effectiveness.

For more details about these principles refer to:
Heer, Jeffrey, and George Robertson. "Animated transitions in statistical data graphics." IEEE Transactions on Visualization and Computer Graphics 13.6 (2007): 1240-1247.



# Requirements
In the previous homework, you designed and implemented a dashboard with three visualization views using the focus + context design paradigm. 
In this assignment, you will enhance your dashboard by incorporating interaction and animation techniques to facilitate effective data drill-downs.

* Implement at least one of the following interaction techniques in at least one of the views.
  * Highlighting: Allow selecting certain data instancess to be more visible without chaning the viewport. 
  * Tooltip: Display additional details of a data instance when hovered over.
  * Zoom and pan: Updates the viewport by rescaling the view to focus on a part of the visualizations.
* Add at least one filtering interaction to coordinate multiple views.
  * Selecting specific data sttributes or subsets of data points in one view, causing another view to highlight the selection or re-render to visualize only the selected data.
  * Examples include drill-down from a context view to a focus view, or from one focus view to another.
* Use animated transitions to incorporate one or more of the transitions listed above in your dashboard. They can be simple but should enhance the presentation of a view, aiding in sensemaking or storytelling.
* All the requirements from HW2 apply to HW3.
* **Your design choices and the rationale behind them will be part of the grading criteria.**
* You are encouraged to implement more interactions to enhance user experience and refine your dashboard. Well-polished dashboards may be selected for in-class presentations, with bonus points rewarded. 

#### Example

Consider the dashboard we described in HW2 that focuses on data exploration of wildfires in California.
Suppose View (1) is the context view, and the other two are focus views.

- Interaction example: in view (1), as fires with larger damage are likely analysis interest, we can add a filter based on burnt acreage to quickly highlight fires causing more damage (highlighting).
- Animated transition example: in view (2) or (3), adding animated transitions (timestep) can improve the presentation of such evolution.
- Coordinated filtering examples
  - (focus and context) In view (1), a user can select a fire of interest, and view (2) updates to display to show the evolution of the particular fire.
  - (focus and focus) If a user identifies a time period of interest in view (2), they can use brushing to isolate the period. This interaction would then highlight the corresponding timeframe in heatmap, supprting the analysis of correlation between meteorological conditions and fire behavior (e.g., drier weather could contribute to fire intensity).


# Submission
To submit for this assignment, you need to first [fork](https://docs.github.com/en/free-pro-team@latest/github/getting-started-with-github/fork-a-repo) this [repository](https://github.com/ucdavis/ECS272-Fall2022). After the fork, clone the forked repository using the following commands: 
```bash
  git clone https://github.com/<your-github-account-name>/ECS272-Fall2024
  cd ECS272-Fall2024/Homework3
```

Create a new folder inside the Homework 3 directory in the forked repository. The name of the folder should be the same as your UC Davis email account name (without ' @ucdavis.edu'). Put all your codes inside this folder, and use "git add" to add all your codes, and then commit. 
```bash
git add <your-filename> 
git commit -m "Homework3" 
git push
```
After you push your code to your repository, follow the instructions [here](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork) to create a pull request for this repository. Finally, submit the hyperlink of the pull request to UCD Canvas. The hyperlink should look like this - "https://github.com/ucdavis/ECS272-Fall2022/pull/{your-pull-request-id}".