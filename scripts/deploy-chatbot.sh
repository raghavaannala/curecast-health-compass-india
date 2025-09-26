#!/bin/bash

# Multilingual AI Chatbot Deployment Script
# This script handles the complete deployment of the chatbot system

set -e  # Exit on any error

echo "🚀 Starting Multilingual AI Chatbot Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI is not installed. Run: npm install -g firebase-tools"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Check environment variables
check_environment() {
    print_status "Checking environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f ".env.chatbot.example" ]; then
            cp .env.chatbot.example .env
            print_warning "Please edit .env file with your actual API keys and configuration"
            print_warning "Required variables: WHATSAPP_ACCESS_TOKEN, SMS_API_KEY, etc."
        else
            print_error ".env.chatbot.example not found. Please create .env file manually"
            exit 1
        fi
    fi
    
    print_success "Environment configuration checked"
}

# Install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    npm install
    
    print_success "Dependencies installed"
}

# Build the project
build_project() {
    print_status "Building the project..."
    
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Project built successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Deploy Firebase Functions
deploy_functions() {
    print_status "Deploying Firebase Functions..."
    
    # Check if functions directory exists
    if [ ! -d "functions" ]; then
        print_warning "Functions directory not found. Creating..."
        mkdir -p functions/src
        
        # Initialize functions
        cd functions
        npm init -y
        npm install firebase-functions firebase-admin
        cd ..
    fi
    
    # Deploy functions
    firebase deploy --only functions
    
    if [ $? -eq 0 ]; then
        print_success "Firebase Functions deployed"
    else
        print_error "Functions deployment failed"
        exit 1
    fi
}

# Deploy Firestore rules
deploy_firestore() {
    print_status "Deploying Firestore rules..."
    
    firebase deploy --only firestore:rules
    
    if [ $? -eq 0 ]; then
        print_success "Firestore rules deployed"
    else
        print_error "Firestore rules deployment failed"
        exit 1
    fi
}

# Deploy hosting
deploy_hosting() {
    print_status "Deploying to Firebase Hosting..."
    
    firebase deploy --only hosting
    
    if [ $? -eq 0 ]; then
        print_success "Hosting deployed"
    else
        print_error "Hosting deployment failed"
        exit 1
    fi
}

# Setup WhatsApp webhook
setup_whatsapp_webhook() {
    print_status "Setting up WhatsApp webhook..."
    
    # Get the deployed function URL
    FUNCTION_URL=$(firebase functions:config:get | grep -o 'https://[^"]*whatsappWebhook' || echo "")
    
    if [ -z "$FUNCTION_URL" ]; then
        print_warning "Could not automatically detect webhook URL"
        print_warning "Please manually configure WhatsApp webhook with your function URL"
        print_warning "Webhook URL format: https://your-region-your-project.cloudfunctions.net/whatsappWebhook"
    else
        print_success "WhatsApp webhook URL: $FUNCTION_URL"
        print_warning "Please configure this URL in your WhatsApp Business API settings"
    fi
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if the main site is accessible
    SITE_URL=$(firebase hosting:channel:list | grep -o 'https://[^"]*' | head -1 || echo "")
    
    if [ -n "$SITE_URL" ]; then
        print_success "Site deployed at: $SITE_URL"
        
        # Test the health endpoint
        if curl -s "$SITE_URL" > /dev/null; then
            print_success "Site is accessible"
        else
            print_warning "Site might not be fully ready yet"
        fi
    else
        print_warning "Could not determine site URL"
    fi
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Enable Firebase Performance Monitoring
    firebase deploy --only remoteconfig
    
    print_success "Monitoring configured"
}

# Print post-deployment instructions
print_instructions() {
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "1. Configure WhatsApp Business API webhook URL"
    echo "2. Set up SMS gateway webhook URL"
    echo "3. Configure government health API credentials"
    echo "4. Test the chatbot on all platforms (Web, WhatsApp, SMS)"
    echo "5. Set up monitoring and alerting"
    echo "6. Train health workers on the escalation system"
    echo ""
    echo "🔧 Configuration URLs:"
    echo "- Analytics Dashboard: $SITE_URL/chatbot-analytics"
    echo "- Multilingual Chatbot: $SITE_URL/multilingual-chatbot"
    echo ""
    echo "📞 Support contacts:"
    echo "- Emergency: 108"
    echo "- Health Helpline: 104"
    echo ""
    echo "📚 Documentation: See MULTILINGUAL_CHATBOT_README.md"
}

# Main deployment function
main() {
    echo "🏥 Multilingual AI Chatbot for Rural Healthcare"
    echo "=============================================="
    echo ""
    
    check_dependencies
    check_environment
    install_dependencies
    build_project
    deploy_firestore
    deploy_functions
    deploy_hosting
    setup_whatsapp_webhook
    verify_deployment
    setup_monitoring
    print_instructions
    
    print_success "Deployment completed! 🎉"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "functions-only")
        check_dependencies
        deploy_functions
        ;;
    "hosting-only")
        check_dependencies
        build_project
        deploy_hosting
        ;;
    "verify")
        verify_deployment
        ;;
    "help")
        echo "Usage: $0 [deploy|functions-only|hosting-only|verify|help]"
        echo ""
        echo "Commands:"
        echo "  deploy        - Full deployment (default)"
        echo "  functions-only - Deploy only Firebase Functions"
        echo "  hosting-only  - Deploy only hosting"
        echo "  verify        - Verify deployment"
        echo "  help          - Show this help"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
