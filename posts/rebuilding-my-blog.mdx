---
title: 'Rebuilding my blog from scratch with Next.js'
date: '2022-04-23'
tags: ['javascript', 'nextjs']
description: 'Rebuilding my blog from a Gatsby.js templated site to a custom Next.js site from scratch.'
---

Update (4/27/2024): I have since rebuilt my blog (once again), and the tags links will no longer work.  I may write another post on the rewrite, but maybe not.

## Version `0.1.x`

The first iteration of my blog was built using a pre-configured [GatsbyJS](https://www.gatsbyjs.com/) site template.  I chose a template ([Novela by Narative](https://novela.narative.co/)) that checked all my boxes for an easy tool to start sharing my writing.

- The theme was modern and sleek
- Everything was mobile-friendly
- Lots of plug-and-play options and prebuilt components that flowed together
  - Article metadata that connects to an author bio page
  - Reading time estimates and progress bars
  - Easy image optimizations
  - A config for a Google Analytics tag
- Deployment was straightforward with GitHub pages
  
But most importantly, all I had to do was add Markdown pages to a directory to get started.  At the time, I didn't really know much about GatsbyJS, other than it being a popular static site generator, and my modern JavaScript knowledge was introductory at-best (albeit growing each and every day).  So this seemed like the perfect route forward.

## The problem

As I started writing more and more posts, I began noting different features I wanted to include on my site.  These weren't terribly complex additions, but rather simple things like adding tags to group common posts or wanting to change the styling of the inline code snippets.

I soon discovered that trying to color outside the lines when using a cookiecutter template can get very complex, very quickly.

I found myself digging into nested modules in my `node_modules` folder where I would need to overload different functions and components to get what I wanted.  It was added complexity than I didn't foresee when I signed up to use a template.  Plus, this site could eventually house more than just a blog, and the template I chose wasn't designed to accommodate much else.

## What now?

If you haven't noticed from the timestamp on my last article, I haven't written a post in ~9 months.  This is largely because I was interviewing for new positions and eventually joined the team at [Radar](https://radar.com) as a Product Engineer!  Preparation for interviews and taking a break after accepting this new position occupied much of the time I would normally spend writing.  Plus, taking a break from coding outside of work is a good way to avoid burnout 🤷‍♂️.

The reason I mention this is because one of the technologies we use at Radar is [Next.js](https://nextjs.org/).  Next.js was something I was already trying to learn in my free time, but I've been able to gain a good amount of experience with it since I've started my new role, and my modern JavaScript fundamentals and understanding have grown drastically in the past several month (expect a lot more JavaScript posts going forward).

Seeing the power of Next.js and knowing I wanted my blog to be more flexible, I decided to recreate my blog from scratch using Next.js.

---

## Next.js

A quick prelude on [Next.js](https://nextjs.org/) for those who have never used it.  [Vercel](https://vercel.com/), the creators of Next.js (and a company to keep 👀 on) says it best, Next.js is...

> "The [React](https://reactjs.org/) Framework for Production"

Next.js comes with a ton of great built-in features including:
- Static + server-side rendering
- Smart bundling and code-splitting, TypeScript support, Routing, Fast Refresh, CSS + Sass support all without complex configs
- Image optimization
- Intuitive code organization (because there are a million-plus ways to organize a React project)
- Static HTML exports (this one is important for our purposes)
- So much more...

**It's an awesome framework.**

Coincidentally enough, the [Next.js hands-on tutorial](https://nextjs.org/learn/basics/create-nextjs-app) walks you through setting up a blog with Next.js. Following this tutorial will set you up with a great and simplistic starter blog (but not quite ready for deployment on GitHub pages, where this blog lives at the time of writing).

A few things this tutorial covers:
- Creating the Next.js app
- Basics like in-app navigation, styling, adding images and more
- Setting up metadata, blog pages, and pre-rendering
- Markdown ➡️ HTML
- Reworking your app to use dynamic routing

The tutorial is great so I won't cover anything that's already covered there.  If you're interested in using Next.js, you should definitely go through it.

---

## Beyond the basics

As mentioned, the [Next.js tutorial](https://nextjs.org/learn/basics/create-nextjs-app) is a great starting point, but I wanted to get my blog to a place where it was comparable to the previous iteration, along with the new features that encouraged me to take on this project in the first place.

To keep things concise, we'll cover adding [tags](/tags), adding a custom domain from [Google Domains](https://domains.google/) to GitHub pages, and adding a GitHub action to automatically build and deploy our blog on each commit.

---

## Tags
Organization within code and outside of code is always at the top of my priority list, so categorizing posts by tag was first on my blog todo list.

### Adding tags to each post

First, let's add tags to each of our posts.  We can work off of the blog data section of the [Next.js tutorial](https://nextjs.org/learn/basics/data-fetching/blog-data) and add some additional YAML metadata to our markdown posts using [gray-matter](https://github.com/jonschlinkert/gray-matter).

Within the current metadata, add a list of tags relevant to the post:

```yaml
---
title: 'Rebuilding my blog from scratch with Next.js'
date: '2022-04-23'
tags: ['nextjs', 'react', 'javascript']
description: 'Rebuilding my blog from a Gatsby.js templated site to a custom Next.js site from scratch.'
---
```

I won't cover rendering of the tags below each posts in the post list, but the tags list should get picked up automatically with the `getSortedPostsData()` function that was already written and is called by `getStaticProps()` in order to pass props down the the post related components.

### /tags/[tag]

What we've done so far will associate posts with a list of tags, but now we also want a page for each tag that lists out the associated posts.  For example, to view `python` related posts, we can go to [/tags/python](/tags/python).

With Next.js, this can be done easily using [dynamic routes](https://nextjs.org/docs/routing/dynamic-routes).

Under the `pages/` directory, create a `pages/tags/[tag].js` file structure.  We'll be repeating similar patterns done within `pages/posts/[id].js`.

Like earlier, we need to implement `getStaticProps()` ([more info here](https://nextjs.org/docs/basic-features/data-fetching/get-static-props)), so we can render these pages at build time.  We also need to implement `getStaticPaths()` ([more info here](https://nextjs.org/docs/basic-features/data-fetching/get-static-paths)) to get a list of all possible tags at build time.

Let's create a `lib/tags.js` file to house some of the helper functions to implement `getStaticProps()` and `getStaticPaths()`.

First, we want to get a list of all the tags so we can write `getStaticPaths()`.  This will require processing all of the files within `posts/`, and processing the metadata using [gray-matter](https://github.com/jonschlinkert/gray-matter).

```js
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'posts');

export const getAllTags = () => {
  const fileNames = fs.readdirSync(postsDirectory);
  const tags = new Set();

  fileNames.map(fileName => {
    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);
    if (matterResult?.data?.tags) {
      matterResult.data.tags.forEach(
        (tag) => tags.add(`/tags/${tag.replace(/\s+/g, '-').toLowerCase()}`)
      );
    }
  });

  return Array.from(tags);
};
```

Now we can call this within `pages/tags/[tag].js` under `getStaticPaths()`

```js
export const getStaticPaths = () => {
  const paths = getAllTags();
  return {
    paths,
    fallback: false,
  }
};
```

Now, we can add another helper function `getPostDataByTag()` in `lib/tags.js` to fulfill `getStaticProps()`.  This is basically what we already do with `pages/posts/[id].js`, and it's not very efficient to do this twice, but all of this is happening at build time so it's not a huge deal for us.

For this, we will use [remark](https://github.com/remarkjs/remark) to process our markdown files.

```js
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'posts');

export const getPostDataByTag = async (tag) => {
  const fileNames = fs.readdirSync(postsDirectory);
  const posts = [];

  fileNames.map(async (fileName) => {
    const id = fileName.replace(/\.md$/, '');
  
    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);

    if (matterResult?.data?.tags && matterResult.data.tags.includes(tag)) {
      // Use remark to convert markdown into HTML string
      const processedContent = await remark()
        .use(html)
        .process(matterResult.content);
      const contentHtml = processedContent.toString();

      // Combine the data with the id and contentHtml
      posts.push({
        id,
        contentHtml,
        markdown: matterResult.content,
        ...matterResult.data,
      });
    }
  });

  return posts;
};
```

We can call this helper function in `pages/tags/[tag].js` under `getStaticProps()`

```js
export const getStaticProps = async ({ params }) => {
  const { tag } = params;
  const taggedPosts = await getPostDataByTag(tag);
  return {
    props: {
      tag,
      taggedPosts,
    },
  };
};
```

Now, you can render the associated tag pages as you wish, but I did it with a few components I had set up:

```jsx
const TagPage = ({ tag, taggedPosts }) => {
  const title = `Posts tagged "${tag}"`;
  return (
    <Layout tagPage title={title} description={title}> 
      <header>
        <Tag tag={tag} isHeader/>
      </header>

      <section>
        <PostList posts={taggedPosts} />
      </section>
    </Layout>
  );
};

export default TagPage;
```

### All tags
The last thing we want to add is a page containing all of the tags in a list, and all of the posts organized into categories.

To do this, we can add `pages/tags.js`, which can be reached at [/tags](/tags).

Once again, we want to implement `getStaticProps()` so we can pre-render this page at build time.  Luckily, we can reuse the two functions we wrote in `lib/tags.js` to make this easy.

```js
import { getAllTags, getPostDataByTag } from '../lib/tags';

export const getStaticProps = async () => {
  const tagsWithPosts = {};
  const allTags = getAllTags();

  for (const tagPath of allTags) {
    const tag = tagPath.replace('/tags/', '');
    tagsWithPosts[tag] = await getPostDataByTag(tag);
  }

  return {
    props: {
      tagsWithPosts,
    },
  };
};
```

Now, you can render this as you'd like using `tagsWithPosts` as a prop in your page component.  I also like having a toggle to show/hide the associated posts.

```jsx
const TagPage = ({ tagsWithPosts }) => {
  const [showPosts, setShowPosts] = useState(false);

  const tagAndPostList = Object.keys(tagsWithPosts).map((tag) => {
    return (
      <section key={tag}>
        <Tag tag={tag} isHeader useLink label={tagsWithPosts[tag].length} />
        {showPosts && <PostList posts={tagsWithPosts[tag]} withPadding /> }
      </section>
    );
  });

  const title = 'All Tags';
  return (
    <Layout title={title} description={title}>
      <header>
        <h1>All tags</h1>
        <div>
          <Checkbox label={'Show posts'} value={showPosts} onChange={(x) => setShowPosts(!showPosts)} />
        </div>
      </header>

      {tagAndPostList}

    </Layout>
  );
};

export default TagPage;
```

Now we have a page with all of our tags 🙌.

---

## Adding a custom domain
Next on my todo list was adding a custom domain to transition from bschoeneweis.github.io ➡️ bradleyschoeneweis.com.  GitHub gives a good overview of the steps [here](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain), but we'll go through it below specifically using [Google domains](https://domains.google/).

We'll be using an apex domain (e.g. bradleyschoeneweis.com).

### GitHub changes
1. Go to the repository settings for your GitHub pages repository
2. Click into the **Pages** section
3. Type your apex domain into the **Custom domain** input and click **Save**

### Google domains changes
1. Go to your [Google domains registrar](https://domains.google.com/registrar/)
2. Click **Manage** on the domain you'd like to use
3. Navigate to the **DNS** settings and under **Resource records**, click **Manage custom records**
4. Refer to the [GitHub documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain) for the official IP address list, but add the following `A` and `CNAME` records

![DNS records](/images/posts/rebuilding-my-blog/dns-records.jpg)

### Final steps and confirmation
1. Head back to the **Pages** settings for your repository and check **Enforce HTTPS**
2. After a bit of time has passed, run `dig www.mynewdomain.com +nostats +nocomments +nocmd` replace with your domain name and your output should look similar to the following:

![dig output](/images/posts/rebuilding-my-blog/dig-output.jpg)

Now your custom domain should be all set up with your GitHub pages blog! 🎉

---

## Simple automated deployment
For the final touches, I didn't want to have to worry about building the blog locally each time, so we'll create a simple GitHub action to build and serve our blog on each commit.

### The `package.json` scripts
If you don't have one already, you should create a `build` script in `package.json` as `build: "next build"`.

I won't cover it here, but you'll also need to go through tutorials related to [exporting your Next.js project as static HTML](https://nextjs.org/docs/advanced-features/static-html-export).  There are a few gotchas here.  For example, you cannot use the Next.js image optimization or API routes.  You can see the full list of [unsupported features](https://nextjs.org/docs/advanced-features/static-html-export#unsupported-features).

Long story short, within your `package.json` file, you should add an `export: "next export"` script.  This will create an `out/` directory with HTML files when this command is run.  You probably want to add this directory to your `.gitignore` file.

### Deploy key
We will be using [peaceiris/actions-gh-pages@v3](https://github.com/peaceiris/actions-gh-pages) for making the deployment step easy.  As a part of this, we want to set up an SSH deploy key for safety.

You can use an SSH key that you already have setup, or create a new one with:

```bash
ssh-keygen -t rsa -b 4096 -C "$(git config user.email)" -f gh-pages -N ""
```

1. Navigate back to your repository settings, and under security, go to **Deploy keys**
2. Click **Add a deploy key** and enter `ACTIONS_DEPLOY_KEY` as the title
3. Paste in your public RSA key (ends with `.pub`)
4. Check **Allow write access** and then click **Add key**

### `deploy.yml`
Now that every thing is set up, we can put this all into a GitHub actions file.

From the root of the project, create `.github/workflows/deploy.yml` and refer to the following:

```yml
name: Deploy to Github Pages

on:
  push:
    branches:
      - develop

jobs:
  deployment:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [14.x]

    steps:
      - uses: actions/checkout@v2

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v2
        with:
          node-version: ${{ matrix.node-version }}

      - name: Update NPM
        run: npm i -g npm@latest

      - name: Cache dependencies
        uses: actions/cache@v2
        with:
          path: ~/.npm
          key: ${{ runner.OS }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.OS }}-node-
            ${{ runner.OS }}-

      - name: Build
        run: |
          npm i --legacy-peer-deps
          npm run build
          npm run export

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          deploy_key: ${{ secrets.ACTIONS_DEPLOY_KEY }}
          publish_dir: ./out
          cname: yoururl.com
```

A few things to note:
- The branch I actively work on is `develop`, so you'll want to update that to the branch you push to
- If you didn't name your deploy key `ACTIONS_DEPLOY_KEY`, change the `deploy_key` value to `secrets.[Your key name]` in the **Deploy** step
- The `cname` value in the **Deploy** step should be replaced with your newly configured custom domain

Now, each time you commit and push up you blog changes, your blog should automatically be built and served under your custom domain.

Just like that, your blog is just as functional as a cookiecutter template 🍪 and more easy to build upon than ever before.

---
