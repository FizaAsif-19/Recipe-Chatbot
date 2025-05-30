// Configuration - Replace with your actual API key
const API_KEY = "AIzaSyAkXXDkH-vN6RWqhvKmIj5xc1bIYzycgZs";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const ingredientsInput = document.getElementById('ingredients');
    const loadingIndicator = document.getElementById('loading');
    const errorBox = document.getElementById('error');
    const errorMsg = document.getElementById('errorMsg');
    const warningBox = document.getElementById('warning');
    const warningMsg = document.getElementById('warningMsg');
    const recipesSection = document.getElementById('recipes');
    const recipesList = document.getElementById('recipesList');
    const charCount = document.getElementById('charCount');

    // State management
    let isLoading = false;

    // Event Listeners
    generateBtn.addEventListener('click', handleGenerate);
    clearBtn.addEventListener('click', clearAll);
    ingredientsInput.addEventListener('input', updateCharCount);

    function updateCharCount() {
        const currentLength = ingredientsInput.value.length;
        charCount.textContent = `${currentLength}/500`;
    }

    async function handleGenerate() {
        if (isLoading) return;
        
        if (!validateInput()) {
            return;
        }

        try {
            isLoading = true;
            updateUIState();
            
            const ingredients = ingredientsInput.value.trim();
            const recipes = await generateRecipes(ingredients);
            displayRecipes(recipes);
            
        } catch (error) {
            showNotification('error', error.message);
        } finally {
            isLoading = false;
            updateUIState();
        }
    }

    async function generateRecipes(ingredients) {
        showNotification('loading', 'Generating recipes...');
        
        const prompt = `Create 5 simple recipes using these ingredients: ${ingredients}.
        Format each recipe EXACTLY like this:
        
        <Recipe>
        <Name>Recipe Name</Name>
        <Time>XX mins</Time>
        <Difficulty>Easy/Medium/Hard</Difficulty>
        <Ingredients>
        - Ingredient 1
        - Ingredient 2
        </Ingredients>
        <Instructions>
        1. Step one
        2. Step two
        </Instructions>
        </Recipe>`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2000
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to generate recipes. Please try again.');
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        if (!text.includes('<Recipe>')) {
            throw new Error('Could not generate recipes. Try being more specific with your ingredients.');
        }

        return parseRecipes(text);
    }

    function parseRecipes(text) {
        const recipeBlocks = text.split('<Recipe>').slice(1);
        return recipeBlocks.map(block => {
            const getContent = (tag) => {
                const match = block.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 's'));
                return match ? match[1].trim() : null;
            };

            return {
                name: getContent('Name') || 'Unnamed Recipe',
                time: getContent('Time'),
                difficulty: getContent('Difficulty'),
                ingredients: getContent('Ingredients')?.split('\n')
                    .filter(line => line.trim())
                    .map(line => line.trim()) || [],
                instructions: getContent('Instructions') || 'No instructions provided'
            };
        }).filter(recipe => recipe.ingredients.length > 0);
    }

    function displayRecipes(recipes) {
        if (!recipes.length) {
            showNotification('error', 'No recipes found. Try different ingredients or be more specific.');
            return;
        }

        recipesList.innerHTML = recipes.map(recipe => `
            <div class="card">
                <h3>${recipe.name}</h3>
                <div class="meta">
                    ${recipe.time ? `<span><i class="fas fa-clock"></i> ${recipe.time}</span>` : ''}
                    ${recipe.difficulty ? `<span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>` : ''}
                </div>
                <h4><i class="fas fa-shopping-basket"></i> Ingredients:</h4>
                <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
                <h4><i class="fas fa-list-ol"></i> Instructions:</h4>
                <p>${recipe.instructions}</p>
            </div>
        `).join('');

        recipesSection.classList.remove('hidden');
        recipesSection.scrollIntoView({ behavior: 'smooth' });
    }

    function validateInput() {
        const ingredients = ingredientsInput.value.trim();
        
        if (!ingredients) {
            showNotification('error', 'Please enter some ingredients you have available');
            return false;
        }
        
        if (ingredients.length < 5) {
            showNotification('warning', 'Try being more specific for better results (e.g., "chicken breast" instead of just "chicken")');
            return true; // Still allow submission but with warning
        }
        
        return true;
    }

    function showNotification(type, message) {
        // Hide all notifications first
        loadingIndicator.style.display = 'none';
        errorBox.style.display = 'none';
        warningBox.style.display = 'none';

        switch (type) {
            case 'loading':
                loadingIndicator.style.display = 'flex';
                loadingIndicator.querySelector('span').textContent = message;
                break;
            case 'error':
                errorBox.style.display = 'flex';
                errorMsg.textContent = message;
                errorBox.scrollIntoView({ behavior: 'smooth' });
                break;
            case 'warning':
                warningBox.style.display = 'flex';
                warningMsg.textContent = message;
                warningBox.scrollIntoView({ behavior: 'smooth' });
                break;
        }
    }

    function updateUIState() {
        generateBtn.disabled = isLoading;
        generateBtn.innerHTML = isLoading 
            ? '<i class="fas fa-spinner fa-spin"></i> Processing...' 
            : '<i class="fas fa-magic"></i> Generate Recipes';
    }

    function clearAll() {
        ingredientsInput.value = '';
        recipesList.innerHTML = '';
        recipesSection.classList.add('hidden');
        hideAllNotifications();
        updateCharCount();
    }

    function hideAllNotifications() {
        loadingIndicator.style.display = 'none';
        errorBox.style.display = 'none';
        warningBox.style.display = 'none';
    }

    // Initialize character count
    updateCharCount();
});

window.closeError = () => document.getElementById('error').style.display = 'none';
window.closeWarning = () => document.getElementById('warning').style.display = 'none';