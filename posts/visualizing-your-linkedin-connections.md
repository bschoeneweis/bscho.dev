---
title: 'Visualizing your LinkedIn connections using Python'
date: '2021-04-08'
tags: ['python', 'pandas']
description: "Using Python's Pandas, NetworkX, and pyvis to understand and visualize companies within a directly connected LinkedIn network."
---

## tl;dr

### Goal
_To understand and visualize the companies within my directly connected network on LinkedIn_

### Process overview
1. **LinkedIn data sources** - retrieving LinkedIn Network data from a "Get a copy of your data" CSV export
2. **Diving into the data** - exploring, cleaning, and aggregating the data with [`Pandas`](https://pandas.pydata.org/)
3. **Creating the network** - creating a network graph using [`NetworkX`](https://networkx.org/)
4. **Visualization** - visualizing the network with [`pyvis`](https://pyvis.readthedocs.io/en/latest/)
5. **Improving the output** - cleaning up the network graph with additional filtering

### Results
_Hover over the nodes for more details_
- [The first network graph](/html/network/first-nx-graph.html)
- [The second (more specific) network graph](/html/network/second-nx-graph.html)

### Python dependencies
```python
# Python standard library
from difflib import get_close_matches

# 3rd party
import networkx as nx
import pandas as pd
from pyvis.network import Network
```

---

Recently, I was exploring [my LinkedIn](https://www.linkedin.com/in/bradley-schoeneweis/) network to see what some of my colleagues from high school and undergrad are currently up to.

As I was scrolling through the connections page, I noticed LinkedIn gives you options to filter and searching with ease, but it doesn't really provide tools to learn about your network as a whole.

So I decided to see if there was an easy way to export my network data to see what I could do with a few hours of exploring the data.


## LinkedIn data sources

My first thought was to checkout out the [LinkedIn's Developer API](https://www.linkedin.com/developers/).

Something I do fairly frequently at my current job is integrating various 3rd-party REST APIs into our platform, so I wanted to see all the functionality and possibilities that this API would provide.

After reading through some documentation, I decided this wasn't a direction I wanted to pursue. Most of their developer products require approval, so I decided to look into other options.

Another thought I had was to write a quick scraping script to pull down the HTML of my connections page and parse out names and companies, but I assumed there had to be a more simple way to get this data.

Finally, after a bit of research, I found that there are various "Get a copy of your data" reports that you can run within LinkedIn.  In order to get to these reports, you can do the following:
1. On the homepage toolbar, click the **Me** dropdown
2. Under the _Account_ section, click **Settings & Privacy**
3. Click on **Get a copy of your data**, and you can view the various reports
4. Select the reports you're interested in, for this, I just checked **Connections**

After requesting the report, it should only take a few minutes before you get an email saying your report is ready for export.


## Diving into the data

To reiterate our goal, we want to get a broad understanding of the companies within the first layer of our network (direct connections). Now, let's load up Python and learn more about this data in this CSV.

### Reading in the data
Once the CSV is downloaded, we can open it up with Pandas and take a look (_output will be commented below_).

```python
import pandas as pd

# We want to skip the first three rows because of Notes at the top
df = pd.read_csv('Connections.csv', skiprows=3)

df.columns
# ['First Name', 'Last Name', 'Email Address', 'Company', 'Position', 'Connected On',]

df.info()
"""
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 376 entries, 0 to 375
Data columns (total 6 columns):
 #   Column         Non-Null Count  Dtype 
---  ------         --------------  ----- 
 0   First Name     375 non-null    object
 1   Last Name      375 non-null    object
 2   Email Address  1 non-null      object
 3   Company        371 non-null    object
 4   Position       371 non-null    object
 5   Connected On   376 non-null    object
dtypes: object(6)
memory usage: 17.8+ KB
"""
```

I won't post the name's of any individuals or full rows to respect the privacy of my connections, but when I searched through the my Connections CSV, I noticed a few initial patterns that would help clean up the data.

### Cleaning up the data

At first glance, the first thing I notice is connections who don't list a current company, so let's get rid of those.

```python
df = df[df['Company'].notna()].sort_values(by='Company')
```

After sorting, another thing I noticed was that some of these company names belong to the same company, but the individuals wrote them differently.

An example of this is `'IBM Global Solution Center'` and `'IBM'`; for our purposes, these should both be classified as `IBM`.

Let's run through a fuzzy match run using [difflib's `get_close_matches`](https://docs.python.org/3/library/difflib.html#difflib.get_close_matches) to try and bucket some of these similar company names.
```python
from difflib import get_close_matches

companies = df['Company'].drop_duplicates()

# cutoff=0.7 is a similarity ranking, and n=10 just takes the top 10 values
similar_companies = {x: get_close_matches(x, companies, n=10, cutoff=0.7)
                     for x in companies}

# We are only interested in the entries that had another match
similar_companies = {x: [name for name in y if name != x]
                     for x, y in similar_companies.items() if len(y) > 1}
```

Now, this solution is not perfect, but it will help draw out some similar companies. You should still run a manual inspection of the data (the IBM example I gave above is one that doesn't show up in the fuzzy match results).

Based upon the results, let's group together some of the companies that had matches.
```python
df['Company'] = df['Company'].replace({
    'KPMG US': similar_companies['KPMG US'],
    'Self-employed': similar_companies['Self-employed'],
    'IBM Global Solution Center': 'IBM',
})
```

The next thing you may have noticed is that in our `similar_companies` dictionary, we cleaned up a `Self-employed` entry.

To stay aligned with our goal, let's drop these entries, as well as your current company.
```python
companies_to_drop = ['self employed', 'your current company']
df = df[~df['Company'].str.lower().isin(companies_to_drop)]
```

### Aggregating the data
Now that our data is cleaned up a bit, let's aggregate and sum the number of connections for each of the companies.

```python
df_company_counts = df['Company'].value_counts().reset_index()
df_company_counts.columns = ['Company', 'Count']  # For ease of understanding
df_company_counts = df_company_counts.sort_values(by='Count', ascending=False)
```

## Creating the network

We have the numbers we want for each company, now let's jump into using `NetworkX` to recreate a network.

The first step will be to initialize our graph, and add yourself as the central node, as it is your network.

```python
import networkx as nx

G = nx.Graph()
G.add_node('Me')
```

Then, we'll loop through our `df_company_counts` DataFrame and add each company as a node.

_You'll notice some HTML tags in the title below, this is just to make it more readable for later_
```python
for _, row in df_company_counts.iterrows():
	# The title will be for more information later on
    title = '<b>{0}</b> ({1})<br><hr>Positions:<br>'.format(row['Company'],
    														row['Count'])

    # In addition to the full company name, let's add each position in a
    # list to see the roles our connections have at these companies
    position_list = ''.join('<li>{}</li>'.format(x)
    						for x in df[df['Company'] == row['Company']]['Position'])
    title += '<ul>{0}</ul>'.format(position_list)

    # For ease of viewing, limit company names to 15 letters
    node_name = row['Company']
    if len(node_name) > 15:
        node_name = node_name[:15] + '...'

    # Add the node and an edge connection ourself to the new node
    G.add_node(node_name, weight=row['Count'], size=row['Count'] * 2, title=title)
    G.add_edge('Me', node_name)
```

And just like that, we've created our network of connections.


## Visualization

Our network graph is created, so let's get into visualizing the network.

There are a few options for visualizing networks including `matplotlib.pyplot`, but I found that `pyvis` was the easiest to use for several reasons:
- `pyvis` generates an HTML file
- Customization is made very easy
- The graph is interactive by default

Let's look into generating this HTML file.
```python
from pyvis.network import Network

nt = Network('100%', '100%', bgcolor='#222222', font_color='white')
nt.from_nx(G)
nt.repulsion()  # Spaces out the nodes
nt.show('nx.html')
```

And it's that simple! We specify a width and height, optional styling attributes, and then we can generate the network graph visual straight from what we created with NetworkX.

Now we can see [the network we generated](/html/network/first-nx-graph.html).

You can hover over each node to see the total number of connections that work at the respective company, and below is a list of the positions held by your connections.

As you can see, this is a bit hard to read into since there are a lot of nodes. Try and imagine reading this with +1,000 connections.

## Improving the output

There are a few ways that our network could be narrowed down.

Being a _Software Developer_, the thought that first occurred to me was to try and dial in on tech-related companies through known positions titles.

To do this, I thought of a list of buzzwords/common job titles that I've seen across LinkedIn, and filtered down the initial DataFrame.

Then, we go through the same process we did in previous sections of generating and displaying the graph.

_Again, this is not perfect, but it's a good starting point._
```python
# Filter down from a list of popular tech positions
positions = [
    'developer', 'engineer', 'ai', 'analytics', 'software', 'cloud', 'cto',
    'sde', 'sre', 'saas', 'product', 'engineering', 'scientist', 'data',
]
df = df[df['Position'].str.contains('|'.join(positions), case=False)]
df_company_counts = df['Company'].value_counts().reset_index()
df_company_counts.columns = ['Company', 'Count']
df_company_counts = df_company_counts.sort_values(by='Count', ascending=False)

# Re-initialize the graph and add the nodes/edges again
G = nx.Graph()
G.add_node('Me')

for _, row in df_company_counts.iterrows():
    title = '<b>{0}</b> ({1})<br><hr>Positions:<br>'.format(row['Company'], row['Count'])
    position_list = ''.join('<li>{}</li>'.format(x)
    						for x in df[df['Company'] == row['Company']]['Position'])
    title += '<ul>{0}</ul>'.format(position_list)
    node_name = row['Company']
    if len(node_name) > 15:
        node_name = node_name[:15] + '...'

    # Since there are less nodes, let's increase the sizes
    G.add_node(node_name, weight=row['Count'], size=row['Count'] * 5, title=title)
    G.add_edge('Me', node_name)

# Generate the visualization
nt = Network('100%', '100%', bgcolor='#222222', font_color='white')
nt.from_nx(G)
nt.repulsion()
nt.show('nx.html')
```

Now, let's look at the [updated results](/html/network/second-nx-graph.html).

Much better! This is more readable and easier to interact with.

And just like that, we achieved our goal of gaining a broader understanding of the companies in our LinkedIn network.

---

**_Possible improvements for those interested_**
- Scraping the profile location of each of your connections to segment by location
- Compiling a list of companies you'd like to work for/are interested in and creating a filtering system
- Researching salary data for positions and gathering average pay by company

---
