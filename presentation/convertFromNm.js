
// Import React
import React from "react";

// Import Spectacle Core tags
import {
  S,
  Layout,
  Appear,
  BlockQuote,
  Cite,
  Deck,
  Heading,
  Markdown,
  ListItem,
  List,
  Quote,
  Slide,
  Image,
  Text
} from "spectacle";

const isDisabled = node => {
  return node.plugins && node.plugins.themes && node.plugins.themes.disabled;
}

const hasTheme = (node, theme) => node.plugins && node.plugins.themes && node.plugins.themes[theme]

export const collectSlideNodes = (root, sectionTitles, collection) => {
  // if no heading children, you are a slide!
  if (isDisabled(root)) return null
  if (root.type === 'header') {
    const hasChildHeaders = root.children.some(child => child.type === 'header')
    if (!hasChildHeaders) {
      collection.push({node: root, sectionTitles})
    } else {
      root.children.forEach(child => {
        collectSlideNodes(child, sectionTitles.concat([root.content]), collection)
      })
    }
  } else {
    root.children.forEach(child => collectSlideNodes(child, sectionTitles, collection))
  }
}

const dfs = (node, fn) => {
  fn(node)
  node.children.forEach(child => dfs(child, fn))
}

const flatten = (prev, item, index) => {
  if (Array.isArray(item)) {
    return prev.concat(item.reduce(flatten))
  } else {
    return prev.concat([item])
  }
}

let getStyle = text => {
  if (!text.includes('{"')) {
    return {text, style: {}}
  }
  const parts = text.split('{"')
  try {
    const style = JSON.parse('{"' + parts.slice(1).join('{"'))
    return {text: parts[0].trim(), style}
  } catch (e) {
    console.error('failed to parse style: ' + text)
    return {text, style: {}}
  }
}

const renderText = text => {
  if (text.startsWith('~~') && text.endsWith('~~')) {
    return <S type='strikethrough' children={text.slice(2, -2)} />
  }
  return text
}

const splitQuote = text => {
  const lines = text.split('\n')
  if (lines[lines.length - 1].startsWith('- ') && lines[lines.length - 2] === '') {
    return {text: lines.slice(0, -2).join('\n'), cite: lines[lines.length - 1].slice(2)}
  }
  return {text, cite: null}
}

const childContent = node => {
    if (isDisabled(node)) return
    if (node.type === 'note') return
    let content = node.content
    let appear = false
    let hidden = false
    if (content.match(/^\!a\b/))  {
      content = content.slice(2)
      appear = true
    }
    if (content.match(/^\!h\b/))  {
      content = content.slice(2)
      hidden = true
    }

    let body
    if (node.type === 'quote') {
      const {text, cite} = splitQuote(content)
      body = <BlockQuote>
        <Quote>{text}</Quote>
        {cite ? <Cite>{cite}</Cite> : null}
        </BlockQuote>
    } else if (node.type !== 'normal') {
      console.log('unexpected type', node.type)
      // TODO handle code block
      if (node.type === 'code') {
        console.log(node)
        body = <CodePane source={node.content} />
      } else {
        body = null
      }
    } else if (content.trim().startsWith('{img} ')) {
      body = <Image width={700} src={'assets/' + content.trim().slice('{img} '.length)} />
    } else if (content.trim() && content.trim() !== '_') {

      const style = hidden ? {visibility: 'hidden'} : {}
      const res = getStyle(content)
      const text = renderText(res.text)
      if (hasTheme(node, 'header1')) {
        body = <Heading size={1} style={style} children={text} />
      } else if (hasTheme(node, 'header2')) {
        body = <Heading size={2} style={style} children={text} />
      } else if (hasTheme(node, 'header3')) {
        body = <Heading size={3} style={style} children={text} />
      } else {
        body = <Text style={style} children={text} />
      }
    } else {
      body = <Layout
        style={{flexDirection: 'column'}}
        children={node.children.map(childContent).reduce(flatten, [])}
      />
    }
    if (appear) {
      return <Appear children={body} />
    }
    return body
};

export const nodeToSlide = ({node, sectionTitles}) => {
  const notes = [];
  dfs(node, node => node.type === 'note' ? notes.push(node) : null)
  const contents = node.children.map(child => {
    return childContent(child)
  }).filter(Boolean).reduce(flatten, [])
  if (!node.content.startsWith('_ ') && node.content.trim() !== '_') {
    let {text, style} = getStyle(node.content)
    contents.unshift(<Heading size={1} style={style}>{text}</Heading>)
  } else if (node.content.slice(2).trim().length) {
    notes.unshift({content: node.content.slice(2).trim()})
  }
  if (sectionTitles.length) {
    const last = sectionTitles[sectionTitles.length - 1]
    contents.unshift(<Text style={{
      position: 'absolute',
      bottom: '100%',
      marginBottom: '32px',
    }}
    children={last}
    />)
  }
  return <Slide
    maxWidth={1500}
    maxHeight={800}
    style={{backgroundColor: 'white'}}
    notes={notes.map(n => n.content).join('<br/><br/>')}
    children={contents}
  />
}
