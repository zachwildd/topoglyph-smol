/**
 * Fetches a markdown document from the url 
 * provided and returns the document's text.
 */
async function fetchDocument(
    documentUrl
) {
    const response = await fetch(documentUrl)
    const body = await response.text()
    return body
}

async function streamResponse(
    key, 
    message, 
    systemPrompt, 
    streamContentCallback
) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: {
            model: models[0],
            stream: true,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
        }
    })

    let buffer = '';
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            while (true) {
                const lineEnd = buffer.indexOf('\n');
                if (lineEnd === -1) break;
                const line = buffer.slice(0, lineEnd).trim();
                buffer = buffer.slice(lineEnd + 1);
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') break;
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0].delta.content;
                        if (content) streamContentCallback(content)
                    } catch (e) {
                        console.error(e)
                    }
                }
            }
        }
    } finally {
        reader.cancel();
    }
}

async function fetchMarkdownDocument(
    documentUrl
) {
    
}

/**
 * 
 */
class Conversation {
    constructor(config) {
        this._config = config
    }

    async buildPrompt() {
        //
        const documentUrls = [
            'https://topoglyph.net/smol/01.md',
            'https://topoglyph.net/smol/02.md', 
            'https://topoglyph.net/smol/03.md', 
            'https://topoglyph.net/smol/04.md', 
            'https://topoglyph.net/smol/05.md',
        ]

        let prompt = ''
        for (const url of documentUrls) {
            const response = await fetch(url, {method: 'GET'})
            prompt += `${await response.text()}\n`
        }
        return prompt
    }

    async continue(message) {
        if (this.isBusy) return
        else if (message == '' || message == null) 
            return window.alert('Message cannot be empty.')

        this.isBusy = true
        this.messages.push(message)

        const message_el = document.createElement('md-block')
        message_el.innerText = message
        message_el.className = 'message right'
        this.messagesContainerElement.appendChild(message_el)

        const response_el = document.createElement('md-block')
        response_el.className = 'message left'
        const writeResponse = part => response_el.mdContent += part
        this.messagesContainerElement.appendChild(response_el)

        if (MODEL_DEFINITION.systemPrompt == null)
            MODEL_DEFINITION.systemPrompt = await buildPrompt()
        await streamResponse(this._config.apiKey, message, writeResponse)
        this.messages.push(response_el.mdContent)
        this.isBusy = false
    }
}

const main = () => {
    // 1. Render a list of model providers
    [
        'anthropic/claude-sonnet-4',
        'deepseek/deepseek-r1-0528',
        'google/gemini-2.5-pro-preview',
        'meta-llama/llama-3.1-405b-instruct',
        'sentientagi/dobby-mini-unhinged-plus-llama-3.1-8b', 
        'qwen/qwen3-235b-a22b',
        'x-ai/grok-3-beta'
    ].forEach(model => 
       document.getElementById('config').innerHTML += `
            <div>
                <input type="radio" id="${model}"/>
                <label for="${model}">${model}</label>
            </div>
        `
    )

    async function renderModules() {
        const modules = [
            {
                title: 'TopoGlyph: A Dual-Encoding Topological Language',
                content: await fetchDocument('https://topoglyph.net/smol/01.md'),
            },
            {
                title: 'TopoGlyph 2.0: Cognitive Process Representation Language',
                content: await fetchDocument('https://topoglyph.net/smol/02.md'),
            },
            {
                title: 'TopoGlyph 3.0: Modeling Breakthrough Cognitive Insights',
                content: await fetchDocument('https://topoglyph.net/smol/03.md'),
            },
            {
                title: 'TopoGlyph 4.0: Exploring TopoGlyph Limitations and Extensions',
                content: await fetchDocument('https://topoglyph.net/smol/04.md'),
            },
            {
                title: 'TopoGlyph 5.0: Integrating Dynamic Feedback Systems and Multi-Modal Cognition',
                content: await fetchDocument('https://topoglyph.net/smol/05.md'),
            },
        ]
        
        for (const mod of modules) {
            document.getElementById('modules').innerHTML += `
                <details class="tg-module">
                    <summary>${mod.title}</summary>
                    <md-block>${mod.content}</md-block>
                </details>
            `
        }
    }
    renderModules()

    // 2. Render the examples (frameworks, snippets)
    const examples = [
        {
            title: '',
            content: ''
        },
        {
            title: '',
            content: ''
        },
        {
            title: '',
            content: ''
        },
        {
            title: '',
            content: ''
        },
    ].forEach(example => 
        document.getElementById('example-gallery').innerHTML += ```
            <div class="tg-example"> 
                <pre>
                    <legend>${example.title}</legend>
                    <code>${example.content}</code>
                </pre>
            </div>
        ```
    )

    // 3. Initialize conversation with system prompt + 
    const conversation = new Conversation({
        key: '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',
        model: null,
        prompt: 'asdf'
    })

    // 4. 
    document.getElementById('send').addEventListener('click', _ => {
        const message = document.getElementById('message').value
        conversation.continue(message)
    })
}
main()