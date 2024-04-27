---
title: 'Setting up a Slack webhook for simple notifications'
date: '2021-07-11'
tags: ['python', 'webhook', 'api']
description: "Setting up a Slack webhook to send plain text or simple HTML notifications to a Slack channel."
---

## tl;dr

### Goal
_To set up a Slack webhook so we can send text and simple HTML notifications to receive in a Slack channel._

### Process Overview
1. Setting up a Slack webhook URL in your Slack workspace to post to a channel
2. Posting a notification to our webhook
3. Creating a simple HTML parser to match the custom Slack markdown flavor

### Python Dependencies
```python
# Python standard library
from html.parser import HTMLParser
import logging
import os
import re
from typing import Any, List, Tuple

# 3rd Party
import requests
```

### Assumptions
I'll assume you have a Slack account, a Slack workspace setup, Slack is installed, and you have knowledge of Python with a basic understanding of webhooks.

---

If you haven't heard of it before, [Slack](https://slack.com/) is a very popular team/workplace communication tool.  In addition to direct messaging, it allows you to separate discussion into various topics or **channels** for more focused team communication.

Another great feature of Slack is that you can add 3rd party [apps](https://slack.com/apps) (or integrations) from your existing stack, or even develop your own!  I have seen this streamline my own productivity, and I personally use a number of Slack apps.

To name a few, you may want to check out the following (assuming you use these tools) which I've found a lot of value in:
- [Sentry](https://slack.com/apps/A011MFBJEUU-sentry?tab=more_info) - for application monitoring
- [Google Calendar](https://slack.com/apps/ADZ494LHY-google-calendar?tab=more_info) - to stay on top of my meetings schedule
- [GitHub](https://slack.com/apps/A01BP7R4KNY-github?tab=more_info) - getting notified of pull requests and meaningful changes to important repositories
- [Jira Cloud](https://slack.com/apps/A2RPP3NFR-jira-cloud?tab=more_info) - staying on top of changes to Jira tickets
- [AWS Chatbot](https://slack.com/apps/A6L22LZNH-aws-chatbot?tab=more_info) - alerts from CloudWatch alarms

You can browse the [Slack app directory](https://slack.com/apps) for more integrations.

However, not every integration is going to provide the functionality you need.  This post will focus on creating our own custom Slack app with the goal of posting simple notifications to a Slack channel.

A common use case where we can apply our app will be sending notifications when any sort of user activity happens on a platform.  As a developer, being notified of when a user completes a certain task can provide a lot of transparency and understanding into the usage of our application, while also keeping a sales teams informed on relevant activity on the platform.  This is the use case we'll focus on.

We will do this by posting to a webhook hosted by Slack.  For more information on webhooks, you can check out [this article](https://zapier.com/blog/what-are-webhooks/) by Zapier.

Let's get started!

---

## Setting up the Slack App
Open Slack, click **Add channels**, and create a new channel called `notifications`.  This is where our Slack app will post to once we set it up.

![Create a Slack channel](/images/posts/slack-webhook/create-channel.jpg)

Now go to a web browser and head to https://api.slack.com/apps/.

Click on **Create an App**

![Create a Slack App](/images/posts/slack-webhook/create-app.jpg)

Select **From scratch**

![Select From Scratch](/images/posts/slack-webhook/from-scratch.jpg)

Create a name for your app and select the workspace you just created your `notifications` channel in.

![Choose an app name and workspace](/images/posts/slack-webhook/app-and-workspace.jpg)


This will redirect you to the **Basic Information** tab for your app.  Here, we'll enable **Incoming Webhooks**.  As it states, this will enable us to post messages from an external source.  In this case, our platform.

![Enable incoming webhooks](/images/posts/slack-webhook/add-webhooks.jpg)


Turn on **Activate Incoming Webhooks** and you will see additional details appear.  Towards the bottom, click on **Add New Webhook to Workspace**.

![Add a new webhook to your workspace](/images/posts/slack-webhook/add-new-webhook.jpg)

You will be redirected again to select which channel to post to.  Select the `notifications` channel that we previously created and press **Allow**.

![Select a channel for your app](/images/posts/slack-webhook/choose-channel.jpg)


This will redirect you back to your app configuration and you will see a webhook URL you can now post to.  This will also include a simple curl POST request you can test with if you'd like.  Copy the webhook URL for later, and remember to **keep it private**.  This is a public URL that anyone can post to.

![Copy your webhook URL](/images/posts/slack-webhook/copy-url.jpg)


You can return to the **Basic Information** of your app settings in Slack to view more API credentials and also edit the look and feel of your new Slack bot.

Now we're ready to dive into the code to communicate with our webhook!

---

## Communicating with our Webhook
To communicate with our webhook, we'll use the [`requests`](https://docs.python-requests.org/en/master/) Python library.  This is a third party library, so you'll want to have a Python virtual environment set up to handle your dependencies.  Virtual environments are out of the scope of this article, but you can read more on them [here](https://docs.python.org/3/tutorial/venv.html).

Inside your virtual environment, you can run the following to install the library.
```bash
pip install requests
```

Now, we'll set up a class to communicate with our Slack endpoint.  We'll start by just sending a plain text message to Slack.

```python
import logging

import requests


logger = logging.getLogger()
logger.setLevel(logging.INFO)


class SlackWebhookBot:
    def __init__(self, webhook_url: str, timeout: int = 15):
        """Class to send messages to a provided Slack webhook URL.

        You can read more about Slack's Incoming Webhooks here:
            https://api.slack.com/messaging/webhooks
        
        Args:
            webhook_url: The webhook URL to send a message to.  Typically
                formatted like "https://hooks.slack.com/services/...".
        
        Kwargs:
            timeout: Number of seconds before the request will timeout.
                This is used to prevent a hang and is set to a default
                value of 15 seconds.
        """
        self.webhook_url = webhook_url
        self.timeout = timeout
        self.headers = {
            'Content-Type': 'application/json',
        }
    

    def send(self, message: str) -> bool:
        """Sends a message to the webhook URL.

        Per the Slack Incoming Webhook example.  The body of the request
        (for plain text) should be formatted as follows:
            `{"text": "Hello, World!"}`

        Args:
            message: Plain text string to send to Slack.

        Returns:
            A boolean representing if the request was successful.
        """
        success = False
        payload = {
            'text': message,
        }
        try:
            r = requests.post(
                self.webhook_url,
                headers=self.headers,
                json=payload,
                timeout=self.timeout
            )
        except requests.Timeout:
            logger.error('Timeout occurred when trying to send message to Slack.')
        except requests.RequestException as e:
            logger.error(f'Error occurred when communicating with Slack: {e}.')
        else:
            success = True
            logger.info('Successfully sent message to Slack.')

        return success
```

Above is the basic setup for communicating with the Slack webhook.  We can run a quick test by moving this code to a script and adding the following.
```python
import os

webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
slack = SlackWebhookBot(webhook_url)
slack.send('Hello, world!')
```

Make sure to set your Slack webhook URL to the `SLACK_WEBHOOK_URL` environment variable, and make sure you're in your virtual environment with the `requests` package installed before running the script.  This can be done on MacOS with the following.
```bash
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
python slack_webhook.py
```

When you run this, you should see a message from you Slack bot appear in the `notifications` channel!

![Hello world message in Slack](/images/posts/slack-webhook/slack-first-message.jpg)


For our notifications to be more helpful, we may want to add links or other formatting.  To do this, we will write our notifications with HTML tags, and then parse these tags and convert them to the [Slack flavored Markdown](https://api.slack.com/reference/surfaces/formatting) called `mrkdwn`.

---

## Adding a simple HTML parser to our class
From the [Slack formatting guide](https://api.slack.com/reference/surfaces/formatting) for messages, we can see all of the ways to format text in our messages.  For our purposes, we will focus on a primary list.

- Making text <i>`_italicized_`</i> (`<i>`)
- Making text <b>`*bold*`</b> (`<b>`)
- Striking through ~<strike>`text`</strike>~ (`<strike>`)
- Adding line breaks (`<br>`)
- Adding `one-line code blocks` using the backtick character (`<code>`)
- Adding unordered lists (line broken dashes) (`<ul><li>`)
- Adding external links `<[external link]|[display text]>` (`<a>`)

Also note that the Slack documentation says that [certain characters need to be escaped](https://api.slack.com/reference/surfaces/formatting#escaping).

There are a few more styles that could be implemented, but we'll focus on just this list for this post.

To do this, we will utilize the [`html`](https://docs.python.org/3/library/html.html) module in the Python standard library to parse HTML tags, attributes, and values.

Let's write a class (we need to inherit functions for the `HTMLParser` class) where we will parse all of the tags and attributes, and escape the message text when needed.  The idea here is that we can construct a string from scratch and for each tag we care about we can "replace" the HTML tags with the relevant mrkdwn syntax.

```python
from html.parser import HTMLParser
import re
from typing import Any, List, Tuple


class SlackHTMLParser(HTMLParser):
    def __init__(self, *args, **kwargs):
        """Escapes and converts an HTML string to Slack flavored
        Markdown (mrkdwn).

        More about Slack's Markdown Flavor (mrkdwn) can be seen here:
            https://api.slack.com/reference/surfaces/formatting
        
        Call using `SlackHTMLParser(message_body).parse()`.
        """
        super().__init__(*args, **kwargs)
        self.slack_message = ''
        self.ignore_tag = False  # Used to skip tags we don't care about
        self.line_break = '::LINE::BREAK::'  # Unique sequence for swapping a <br>


    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Any]]):
        """Called when the opening of a tag is encountered.

        The idea here is to swap out the tag with the respective mrkdwn
        symbol.

        Args:
            tag: Lowercase name of the HTML tag.  E.G. `br` or `i`.
            attrs: List of tuples with the tuple having the following form:
                (attribute name, value).  E.G. ('href', 'www.example.com').
        """
        if tag in ['i', 'em']:
            self.slack_message += '_'
        elif tag in ['b', 'strong']:
            self.slack_message += '*'
        elif tag == 'strike':
            self.slack_message += '~'
        elif tag in ['br', 'p', 'ul']:
            self.slack_message += self.line_break
        elif tag == 'li':
            self.slack_message += f'{self.line_break}- '
        elif tag == 'code':
            self.slack_message += '`'
        elif tag == 'a':
            href = [x[1] for x in attrs if x[0] == 'href']
            if len(href) > 0:
                self.slack_message += f'<{href[0]}|'
        else:
            self.ignore_tag = True


    def handle_data(self, data: str):
        """Handles the data within a tag.

        This is called after `handle_starttag` and before `handle_endtag`.

        We will also escape the following text per Slack's documentation:
        - '&' -> '&amp;'
        - '<' -> '&lt;'
        - '>' -> '&gt;'

        Args:
            data: The data/string within the HTML tag.
        """
        if not self.ignore_tag:
            self.slack_message += data\
                .replace('&', '&amp;')\
                .replace('<', '&lt;')\
                .replace('>', '&gt;')


    def handle_endtag(self, tag: str):
        """Called when the closing of a tag is encountered.

        The idea here is to swap out the tag with the respective mrkdwn
        symbol.  This is basically the same as the handle_starttag.

        Args:
            tag: Lowercase name of the HTML tag.  E.G. `br` or `i`.
        """
        if tag in ['i', 'em']:
            self.slack_message += '_'
        elif tag in ['b', 'strong']:
            self.slack_message += '*'
        elif tag == 'strike':
            self.slack_message += '~'
        elif tag == 'p':
            self.slack_message += self.line_break
        elif tag == 'code':
            self.slack_message += '`'
        elif tag == 'a':
            self.slack_message += '>'
        
        self.ignore_tag = False


    def parse(self, html_string: str) -> str:
        """Parses a given HTML string and applies simple formatting.
        
        Note that we need to apply the line break replacing here
        instead of with the handle tag methods.

        Args:
            html_string: The HTML string to convert to Slack mrkdwn.

        Returns:
            A formatted Slack mrkdwn string.
        """
        self.feed(html_string)
        return re.sub(
            r'^(\n)+',  # Remove the leading line breaks
            '',
            ' '.join(self.slack_message.split()).replace(self.line_break, '\n')
        )
```

We can test our class out with the following code.

```python
html_string = '''
    <p>
        Here <i>is</i> a <strike>paragraph</strike> with a <b>lot</b> of formatting.
    </p>
    <br>
    <code>Code sample</code> & testing escape.
    <ul>
        <li>
            <a href="https://www.google.com">Google</a>
        </li>
        <li>
            <a href="https://www.amazon.com">Amazon</a>
        </li>
    </ul>
'''
parser = SlackHTMLParser()
slack_message = parser.parse(html_string)
print(slack_message)
```

Now we can test our formatter in an actual Slack message!  Import your formatter class or add it to your existing code so you're able to do the following.

```python
html_string = '''
    <p>
        Here <i>is</i> a <strike>paragraph</strike> with a <b>lot</b> of formatting.
    </p>
    <br>
    <code>Code sample</code> & testing escape.
    <ul>
        <li>
            <a href="https://www.google.com">Google</a>
        </li>
        <li>
            <a href="https://www.amazon.com">Amazon</a>
        </li>
    </ul>
'''
webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
parser = SlackHTMLParser()
slack_message = parser.parse(html_string)
slack = SlackWebhookBot(webhook_url)
slack.send(slack_message)
```

You should see the following message in your notifications channel.

![Second message in Slack](/images/posts/slack-webhook/slack-format-message.jpg)

Looks pretty good!  _Note that you can still send plain text messages, you don't need to use HTML._

For some final adjustments, you may have noticed that the message preview on the notification that popped up showed the actual `mrkdwn` characters as opposed to a formatted notification.  This looks a little sloppy, so let's make a new notification title that is similar to an email subject line.

We will briefly look at the basics of Slack's [Block Kit](https://api.slack.com/block-kit), which is a powerful way to add lots of customization to your Slack messages.  You can also explore Block Kit with Slack's [Block Kit Builder](https://app.slack.com/block-kit-builder/) which provides a preview of your Slack message.

Without diving too much into the details on the Block Kit, let's update our `SlackWebhookBot` class and add a method that adds a title block and a body block for our message.  Our subject line will appear in the notification itself, and also in the actual Slack message.

```python
# Add the `Dict` typing import to the existing typing imports
from typing import Dict

def format_message(self, subject: str, body: str) -> Dict:
    """Formats the subject and message body into Slack blocks.

    Args:
        subject: Subject that will appear on the notification popup.
        body: The full message body.

    Returns:
        A dictionary payload with Slack block formatting.
    """
    return {
        'text': subject,
        'blocks': [
            {
                'type': 'section',
                'text': {
                    'type': 'mrkdwn',
                    'text': f'*{subject}*',
                },
            },
            {
                'type': 'section',
                'text': {
                    'type': 'mrkdwn',
                    'text': body,
                },
            },
        ],
    }
```

Now we can tweak our `send` method to format a new message and accept a subject string as a Kwarg.

```python
def send(self, message: str, subject: str = 'New message!') -> bool:
    """Sends a formatted message to the webhook URL.

    Args:
        message: Plain text string to send to Slack.

    Kwargs:
        subject: The subject of the message that will appear in the notification
            preview.

    Returns:
        A boolean representing if the request was successful.
    """
    success = False
    payload = self.format_message(subject, message)
    try:
        r = requests.post(
            self.webhook_url,
            headers=self.headers,
            json=payload,
            timeout=self.timeout
        )
    except requests.Timeout:
        logger.error('Timeout occurred when trying to send message to Slack.')
    except requests.RequestException as e:
        logger.error(f'Error occurred when communicating with Slack: {e}.')
    else:
        success = True
        logger.info('Successfully sent message to Slack.')

    return success
```

And we can test our notification with a new subject line.

```python
html_string = '''
    <p>
        Here <i>is</i> a <strike>paragraph</strike> with a <b>lot</b> of formatting.
    </p>
    <br>
    <code>Code sample</code> & testing escape.
    <ul>
        <li>
            <a href="https://www.google.com">Google</a>
        </li>
        <li>
            <a href="https://www.amazon.com">Amazon</a>
        </li>
    </ul>
'''
webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
parser = SlackHTMLParser()
slack_message = parser.parse(html_string)
slack = SlackWebhookBot(webhook_url)
slack.send(slack_message, subject='You\'ve completed the tutorial!')
```

You should see a notification appear with the following preview

![Slack notification}](/images/posts/slack-webhook/slack-popup.jpg)


and the following message in your channel.

![Last message in Slack](/images/posts/slack-webhook/slack-last-message.jpg)


We have a custom Slack notification app!  You can place the `send` message calls all across your applications with related messages and now you can have a better pulse on user activity that developers and any other employees/stakeholders can easily access.

---

For those wanting additional challenges or to continue developing their custom app, Slack has added a lot of really cool tools to the Block Kit.  There are a ton of really cool possibilities that can be added on by updating the `format_message` method in our `SlackWebhookBot` class.

Explore the Slack's [Block Kit Builder](https://app.slack.com/block-kit-builder/) and see what you can make!

---
