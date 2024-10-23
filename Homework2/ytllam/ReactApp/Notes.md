# ECS 272 Fall 2024 - Homework 2 design notes

Linus Lam - 914876113

## Dataset

Chosen dataset is <https://www.kaggle.com/datasets/uciml/student-alcohol-consumption>. Only the math class dataset was used for this HW - the plan is for future interactivity to enable picking between classes.

## Visualizations

### Visualization 1: Parallel coordinate plot

The dataset is highly complex with a lot of ordinal and categorical data. Many columns might be related to multiple other columns. I picked a parallel coordinate plot to visualize this.

Since there's a lot of columns, I picked a few ordinal ones to start off with that are most aligned with student quality of life and health. Future interactivity could involve selecting more/less columns to be included.

Each plotted line is shaded to represent the final math grade of the student. While this plot is admittedly not readable right now, the plan for HW3 is to make the color scale for grade Brushable, so that one can select a grade range and visualize the most common characteristics of students who score within that range.

Due to screen size issues with narrow browser windows, I opted for a vertical plot with categories spanning the graph vertically. This way the axes can be readable and well-separated even with a narrow window.

### Visualization 2: Heatmap

I wanted to visualize the relationships between weekend drinking frequency and grades by grade period. To combine these 3 dimensions, I chose to use a heatmap:

- x axis: grade period
- y axis: weekend drinking frequency
- cell (X, Y): the mean grade for grade period X among students with Y weekend drinking frequency

To be consistent with Visualization 1, I chose the same red-lime color scale. However, since all the mean grades are clustered around the middle, it is hard to tell the difference between color shades. In view of this, I chose to overlay the actual numbers on each cell.

In terms of future interactivity, I'm interested in adding a picker to switch the y axis between all the different categorical variables. While it is easy to dynamically compute the mean grade by period for different categories, generating the labels/axes titles could require defining a lot of classes and/or hardcoding of mappings.

### Visualization 3: Pie chart

A simple pie chart to visualize the proportions of students that drink a lot vs very little, etc.

While a histogram might have been better suited for this specific dimension - this pie chart shows frequencies of frequencies, which is not intuitive - my plan is to use this as a drilldown panel for visualizing all other columns in HW3. There are quite a few binary or categorical dimensions in the dataset, where a piechart would make it easier to discern percentages of the whole compared to a histogram/bar chart.

I have picked a red-purple color scale to refer to alcohol consumption levels, with the darkest shade indicating high alcohol consumption frequency.