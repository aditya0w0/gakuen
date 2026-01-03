# Documentation

Quick links to all project documentation.

## Documentation Map

```mermaid
flowchart LR
    subgraph Setup ["Setup Guides"]
        A[Firebase Setup]
        B[Token Auth]
        C[Admin Config]
    end
    
    subgraph Security ["Security"]
        D[Security Notes]
    end
    
    subgraph Troubleshooting ["Troubleshooting"]
        E[Firestore Rules]
        F[Known Issues]
    end
    
    Start((Start)) --> A
    A --> B
    B --> C
    C --> D
    
    D -.-> E
    D -.-> F
    
    style A fill:#e3f2fd
    style B fill:#e3f2fd
    style C fill:#e3f2fd
    style D fill:#fff3e0
    style E fill:#ffebee
    style F fill:#ffebee
```

## Setup Guides

| Document | Description |
|----------|-------------|
| [Firebase Setup](setup/firebase-setup.md) | Configure Firebase project and environment |
| [Firebase Token Auth](setup/firebase-token-auth.md) | Implement secure token-based authentication |
| [Make Admin](setup/make-admin.md) | Grant administrative privileges to users |

## Security

| Document | Description |
|----------|-------------|
| [Security Notes](security-notes.md) | Security guidelines, best practices, and authentication recommendations |

## Troubleshooting

| Document | Description |
|----------|-------------|
| [Firestore Rules Fix](troubleshooting/firestore-rules-fix.md) | Resolve common Firestore permission issues |
| [Known Issues](troubleshooting/known-issues.md) | Known bugs and their workarounds |
