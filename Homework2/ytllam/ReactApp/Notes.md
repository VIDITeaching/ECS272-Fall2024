# Homework 2 design notes
## Dataset
Chosen dataset is https://www.kaggle.com/datasets/uciml/student-alcohol-consumption.

## Visualizations

### Visualization 1
The factors that contribute to final grade
- Parallel coordinates plot. Color coded according to final grade (consistent with heatmap above).
- Include numeric dimensions like drinking, social and family relationships.
- selected dimensions. Probably household or social.
- future interactivity: brushable
- ** shows distribution of answers in categories and links them to each other/final grade**

### Visualization 2
Heatmap of grade and [drinking]
- every student has a drinking value
- every student has a grade for G1 2 and 3 (x) and the grades have a continuous scale (heat)
- Allows visualizing of how drinking impacts grades overall and over time!
- For numeric data
- Color: red to Green? Green being high marks.
Layers:
G3
G2
G1
Dalc
Walc
- future interactivity: change variable

### Visualization 3
- pie chart or horizontal pie chart for breaking down distribution a single variable
- allows visualizing composition of responses
- not related to output
- future interactivity: change variable
- For binary and categorical data

TODO: check slides for channel effectiveness