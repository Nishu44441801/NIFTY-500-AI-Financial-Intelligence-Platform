import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import os

def create_academic_poster():
    print("🎨 Rendering thesis poster via Matplotlib...")
    
    # Create a 16:9 widescreen canvas for presentation
    fig = plt.figure(figsize=(16, 9), facecolor='#f4f6f9')
    fig.suptitle("FinIntel Pro: AI-Driven Corporate Financial Intelligence", 
                 fontsize=28, fontweight='bold', color='#1e293b', y=0.95)

    # --- SECTION 1: Architecture ---
    ax1 = plt.subplot(131)
    ax1.set_title("1. Decoupled Architecture", fontsize=16, fontweight='bold', color='#3b82f6')
    architecture_text = (
        "Phase 1: Proof of Concept\n\n"
        "• Data: yfinance APIs\n"
        "• Storage: SQLite Database\n"
        "• Model: XGBoost\n"
        "• Engine: Llama 3 (Local)\n\n"
        "Status: 5-Company Batch Validated."
    )
    ax1.text(0.1, 0.6, architecture_text, fontsize=14, va='center', ha='left', 
             bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=1'))
    ax1.axis('off')

    # --- SECTION 2: XAI (SHAP Plot) ---
    ax2 = plt.subplot(132)
    ax2.set_title("2. Explainable AI (XAI)", fontsize=16, fontweight='bold', color='#3b82f6')
    
    # Load your actual SHAP image if it exists
    shap_path = "data/shap_summary.png"
    if os.path.exists(shap_path):
        img = mpimg.imread(shap_path)
        ax2.imshow(img)
    else:
        ax2.text(0.5, 0.5, "[data/shap_summary.png Missing]\nRun your ML script first.", 
                 fontsize=12, ha='center', color='red')
    ax2.axis('off')

    # --- SECTION 3: Llama 3 & Roadmap ---
    ax3 = plt.subplot(133)
    ax3.set_title("3. Local LLM & Scaling", fontsize=16, fontweight='bold', color='#3b82f6')
    scaling_text = (
        "LLM Reasoning Layer:\n"
        "Translates mathematical SHAP\n"
        "weights into human-readable,\n"
        "strategic audits. Runs 100%\n"
        "locally to protect corporate data.\n\n"
        "Phase 2 Roadmap:\n"
        "• NIFTY-500 Database Migration\n"
        "• Dynamic Local SHAP Plots\n"
        "• Automated API Rate-Limiting"
    )
    ax3.text(0.1, 0.5, scaling_text, fontsize=14, va='center', ha='left',
             bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=1'))
    ax3.axis('off')

    # Render and save
    plt.tight_layout(rect=[0, 0.03, 1, 0.90])
    plt.savefig("thesis_poster.png", dpi=300)
    print("✅ Success! Open 'thesis_poster.png' in your project folder.")

if __name__ == "__main__":
    create_academic_poster()