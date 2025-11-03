# High-Performance OCR Document Extraction Pipeline

This project aims to apply architectural designs and optimization techniques to accelerate in-batch OCR document extraction, focusing on minimizing cost and latency while ensuring high accuracy.

## Project Stack
- **Backend**: NestJS
- **Frontend**: React
- **Database**: PostgreSQL

## How to Run

Clone the repository:
Bash
```
git clone <repository-url>
cd <repository-name>
```

Add your benchmark documents and the dataset.json to the backend/benchmark directory. The required structure is:

```
backend/benchmark/
├── dataset.json
└── files/
    └── document1.pdf
    └── document2.pdf
```

Create your local environment file from the example:
```
cp.env.example.env
```

Update the .env file with your API keys and database credentials.

Build and run the application using Docker Compose:
Bash
```
docker compose up --build
```
## Project Design: A Multi-Stage Extraction Pipeline

Given an extraction task, the document is routed through a pipeline of different extraction methods. This architecture follows the Strategy design pattern, where each pipeline step attempts to extract a subset of the desired keys.  

The process is designed to be cost-effective: the cheapest and fastest methods are tried first. Any fields that cannot be extracted are passed to the next, more expensive step in the funnel.

### First Step: Caching

This is the cheapest and fastest extraction step. A cache hit can resolve a field "instantly," significantly reducing the load and cost of subsequent steps.  

- **Cache Key**: A granular key is generated using the current session, the document's hash, and the specific extraction key. This allows for field-level caching.
- **Hashing**: We use SHA-256 for document hashing to ensure speed and prevent hash collisions.
- **Optimization**: The cache database utilizes a bitmap index over the session, hash, and key columns. This allows for performing a logical AND across the bit indicators, making cache-hit lookups extremely fast.

### Second Step: LLM Extraction

This step is reserved for fields that could not be resolved from the cache.

- Prompts are optimized and reduced to minimize token usage.   
- **Structured Output**: The model is instructed to return only valid, structured JSON.
- **Low Temperature**: The temperature parameter is set to a low value. For extraction tasks, it is critical that the model remains deterministic and does not "get creative" by picking less likely tokens.  
- **Central Idea**: Asynchronous Queueing

The most significant time constraint in the pipeline is the asynchronous LLM API call. To prevent this from blocking the entire application, we have implemented a queueing system to orchestrate pending extraction operations.

This queue allows the system to "work" on other document requests while waiting for the external API to respond. It also provides a crucial mechanism for rate limiting, ensuring the number of open promises respects the LLM provider's API limits.

### Live Updates

The frontend benchmark process features a **WebSocket** connection to provide live updates as documents are processed by the pipeline.

## Challenges Faced

- API Rate Limitations: The primary challenge was handling external API rate limits and latency without halting the entire batch process.
- Solution: The implementation of the asynchronous queueing system successfully resolved this, allowing for high throughput and concurrent processing while respecting API limits.

## Next Steps

- Implement a Heuristic Library: Build out a robust library of regular expressions (Regex) for common, highly structured fields (e.g., CPF, date, email, phone numbers).   
- Integrate Local NER Models: Introduce an intermediate extraction step using local, lightweight models for Named Entity Recognition (NER). This step is less expensive than a full LLM call but more flexible than simple Regex. The goal is to use NER to identify which extraction keys (e.g., "customer_name," "company") are likely related to which entity category (PER, ORG) and apply the correct specialized extractor.  
- For specialized entity types not covered by general-purpose models, the Hugging Face Transformers ecosystem offers a vast repository of pre-trained models. This includes thousands of smaller, distilled models (such as DistilBERT or MiniLM) that have been fine-tuned by the community for specific token classification (NER) tasks. These can be run locally to provide a highly accurate, low-cost extraction layer.
