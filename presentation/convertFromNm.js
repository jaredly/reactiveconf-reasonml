
// Import React
import React from "react";
import ReactDOM from 'react-dom'

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
  Table,
  TableRow,
  TableItem,
  TableHeaderItem,
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

    const key = Math.random().toString(16)

    let body
    if (node.type === 'quote') {
      const {text, cite} = splitQuote(content)
      body = <BlockQuote key={key} >
        <Quote>{text}</Quote>
        {cite ? <Cite>{cite}</Cite> : null}
        </BlockQuote>
    } else if (node.type === 'list') {
      if (node.content === '{table}') {
        body = <Table
        children={node.children.map(child => (
          <TableRow
            children={child.content.split('|').map(text => <TableItem>{text.trim()}</TableItem>)}
          />
        ))}
        />
      } else {
        body = <List
          children={node.children.map(child => <ListItem>{child.content}</ListItem>)}
        />
      }
    } else if (node.type !== 'normal') {
      console.log('unexpected type', node.type)
      // TODO handle code block
      if (node.type === 'code') {
        console.log(node)
        body = <CodePane key={key} source={node.content} />
      } else {
        body = null
      }
    } else if (content.trim().startsWith('{img} ')) {
      const {text, style} = getStyle(content.slice('{img} '.length))
      body = <Image key={key} style={style} width={style.width} height={style.height} src={'assets/' + text.trim()} />
    } else if (content.trim().startsWith('{spacer:')) {
      body = <div key={key} style={{
        height: parseInt(content.trim().slice('{spacer:'.length, -1))
      }} />
    } else if (content.trim() && !content.startsWith('_ ')) {
      // console.log(content)
      const style = hidden ? {visibility: 'hidden'} : {}
      const res = getStyle(content)
      const text = renderText(res.text)
      if (hasTheme(node, 'header1')) {
        body = <Heading key={key} size={1} style={style} children={text} />
      } else if (hasTheme(node, 'header2')) {
        body = <Heading key={key} size={2} style={style} children={text} />
      } else if (hasTheme(node, 'header3')) {
        body = <Heading key={key} size={3} style={style} children={text} />
      } else {
        body = <Text key={key} style={style} children={text} />
      }
    } else {
      const res = getStyle(content)
      console.log('style', res.style)
      body = <Layout
        key={key}
        style={[{flexDirection: 'column'}, res.style]}
        children={node.children.map(childContent).reduce(flatten, [])}
      />
    }
    if (appear) {
      return <Appear key={key} children={body} />
    }
    return body
};

class Portal extends React.Component {
  componentDidMount() {
    this.node = document.createElement('div')
    document.body.appendChild(this.node)
    ReactDOM.render(this.props.children, this.node)
  }

  componentWillUnmount() {
    ReactDOM.unmountComponentAtNode(this.node)
    this.node.parentNode.removeChild(this.node)
  }

  render() {
    return null
  }
}

const collectNotes = (root, inNote, collector) => {
  if (inNote || root.type === 'note') collector.push(root.content)
  root.children.forEach(child => collectNotes(child, inNote || root.type === 'note', collector))
}

export const nodeToSlide = ({node, sectionTitles}) => {
  const notes = [];
  collectNotes(node, false, notes)
  // dfs(node, node => node.type === 'note' ? notes.push(node) : null)
  const contents = node.children.map(child => {
    return childContent(child)
  }).filter(Boolean).reduce(flatten, [])
  let titleText = null
  if (!node.content.startsWith('_ ') && node.content.trim() !== '_') {
    let {text, style} = getStyle(node.content)
    let size = 1
    if (text.match(/^\{\d\}/)) {
      size = parseInt(text[1])
      text = text.slice(3).trim()
    }
    titleText = text
    contents.unshift(<Heading key="title" size={size} style={style}>{text}</Heading>)
  } else if (node.content.slice(2).trim().length) {
    notes.unshift(node.content.slice(2).trim())
  }
  if (sectionTitles.length) {
    const last = sectionTitles[sectionTitles.length - 1]
    if (last !== titleText) {
      contents.unshift(<Portal key="header" ><div style={{
        position: 'absolute',
        top: '32px',
        left: '40px',
      }}
      children={last}
      /></Portal>)
    }
  }
  return <Slide
    key={node._id}
    // maxWidth={1500}
    // maxHeight={800}
    style={{
      backgroundColor: 'white',
      // minHeight: 800,
      // minWidth: 1500,
    }}
    notes={notes.join('<br/><br/>')}
    children={contents}
  />
}
