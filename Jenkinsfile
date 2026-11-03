pipeline {
    agent any

    environment {
        PYTHONUNBUFFERED = '1'
        BUILD_TAG = "v1.0.${BUILD_NUMBER}"
        PORT = '8000'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing required Python packages...'
                sh 'python3 -m pip install --upgrade pip'
                sh 'python3 -m pip install -r backend/requirements.txt'
            }
        }

        stage('Automated Unit Tests') {
            steps {
                echo 'Running pytest suite...'
                sh 'python3 -m pytest backend/test_main.py'
            }
        }

        stage('Package Artifact') {
            steps {
                echo "Packaging artifact with build version: ${BUILD_TAG}"
                sh "tar -czvf devmind_backend_${BUILD_TAG}.tar.gz backend/"
            }
        }

        stage('Deploy Application') {
            steps {
                echo "Deploying FastAPI backend server on port ${PORT}..."
                sh '''
                    # Free port 8000
                    lsof -ti:8000 | xargs kill -9 2>/dev/null || true

                    # Start uvicorn with explicit python3 module invocation
                    JENKINS_NODE_COOKIE=dontKillMe nohup python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 > uvicorn.log 2>&1 &
                    
                    # Sleep to allow server initialization
                    sleep 3

                    # Check health status via Python httpx/urllib fallback
                    python3 -c "
import urllib.request, time, sys
for i in range(5):
    try:
        res = urllib.request.urlopen('http://127.0.0.1:8000/health')
        if res.getcode() == 200:
            print('Deployment Successful: Health Endpoint Responding OK')
            sys.exit(0)
    except Exception as e:
        time.sleep(1)
print('Health check failed! Server log contents:')
with open('uvicorn.log') as f:
    print(f.read())
sys.exit(1)
"
                '''
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: "devmind_backend_*.tar.gz", allowEmptyArchive: true
            echo "CI/CD Execution finished for build: ${BUILD_TAG}"
        }
        success {
            echo 'CI/CD Pipeline execution succeeded!'
        }
        failure {
            echo 'CI/CD Pipeline execution failed!'
        }
    }
}
