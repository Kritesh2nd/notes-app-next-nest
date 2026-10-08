pipeline {
agent any

```
tools {
    nodejs 'Node-24'
}

parameters {
    booleanParam(
        name: 'ALWAYS_BUILD',
        defaultValue: true,
        description: 'Testing mode: always test, build, Docker build, Docker push, and deploy everything'
    )

    booleanParam(
        name: 'PUSH_DOCKER_IMAGE',
        defaultValue: true,
        description: 'Build and push changed Docker images'
    )

    booleanParam(
        name: 'DEPLOY',
        defaultValue: true,
        description: 'Deploy changed applications'
    )

    string(
        name: 'DOCKER_IMAGE_NAME_FRONTEND',
        defaultValue: 'moudle8848/noteapp-next',
        description: 'Frontend Docker image repository'
    )

    string(
        name: 'DOCKER_IMAGE_NAME_BACKEND',
        defaultValue: 'moudle8848/noteapp-nest',
        description: 'Backend Docker image repository'
    )

    string(
        name: 'DEPLOY_SERVER_IP',
        defaultValue: '',
        description: 'Private IP address of the deployment EC2 server'
    )
}

environment {
    DOCKER_CREDENTIALS_ID = 'docker_credentials'
    DEPLOY_SSH_CREDENTIALS_ID = 'deploye_server_credentials'
    DEPLOY_DIR = '/opt/noteapp'

    ALWAYS_BUILD = "${params.ALWAYS_BUILD}"

    FRONTEND_IMAGE_TAG = "${params.DOCKER_IMAGE_NAME_FRONTEND}:${env.BUILD_NUMBER}"
    BACKEND_IMAGE_TAG = "${params.DOCKER_IMAGE_NAME_BACKEND}:${env.BUILD_NUMBER}"
}

options {
    timestamps()

    buildDiscarder(
        logRotator(
            numToKeepStr: '10'
        )
    )

    skipDefaultCheckout(true)

    disableConcurrentBuilds()
}

stages {

    stage('Checkout') {
        steps {
            checkout scm
        }
    }

    stage('Detect Changes') {
        steps {
            script {
                def changes = sh(
                    script: '''
                        if git rev-parse HEAD~1 >/dev/null 2>&1; then
                            git diff --name-only HEAD~1 HEAD
                        else
                            git ls-files
                        fi
                    ''',
                    returnStdout: true
                ).trim()

                def changedFiles = changes ? changes.split('\\n') : []

                env.FRONTEND_CHANGED = changedFiles.any {
                    it.startsWith('frontend/')
                } ? 'true' : 'false'

                env.BACKEND_CHANGED = changedFiles.any {
                    it.startsWith('backend/')
                } ? 'true' : 'false'

                env.DEPLOY_CONFIG_CHANGED = changedFiles.any {
                    it == 'docker-compose.yml'
                } ? 'true' : 'false'

                echo "Frontend changed: ${env.FRONTEND_CHANGED}"
                echo "Backend changed: ${env.BACKEND_CHANGED}"
                echo "Deployment config changed: ${env.DEPLOY_CONFIG_CHANGED}"
                echo "Always build: ${params.ALWAYS_BUILD}"
            }
        }
    }

    stage('Test & Build Backend') {
        when {
            expression {
                params.ALWAYS_BUILD ||
                env.BACKEND_CHANGED == 'true'
            }
        }

        steps {
            dir('backend') {
                sh '''
                    set -e

                    npm ci
                    npm test
                    npm run build
                '''
            }
        }
    }

    stage('Build Frontend') {
        when {
            expression {
                params.ALWAYS_BUILD ||
                env.FRONTEND_CHANGED == 'true'
            }
        }

        steps {
            dir('frontend') {
                sh '''
                    set -e

                    npm ci
                    npm run build
                '''
            }
        }
    }

    stage('Docker Build') {
        when {
            expression {
                params.ALWAYS_BUILD ||
                (
                    params.PUSH_DOCKER_IMAGE &&
                    (
                        env.FRONTEND_CHANGED == 'true' ||
                        env.BACKEND_CHANGED == 'true'
                    )
                )
            }
        }

        steps {
            script {

                if (params.ALWAYS_BUILD || env.FRONTEND_CHANGED == 'true') {
                    sh '''
                        set -e

                        docker --version

                        docker build \
                            -t "$FRONTEND_IMAGE_TAG" \
                            -t "${DOCKER_IMAGE_NAME_FRONTEND}:${GIT_COMMIT}" \
                            ./frontend
                    '''
                }

                if (params.ALWAYS_BUILD || env.BACKEND_CHANGED == 'true') {
                    sh '''
                        set -e

                        docker --version

                        docker build \
                            -t "$BACKEND_IMAGE_TAG" \
                            -t "${DOCKER_IMAGE_NAME_BACKEND}:${GIT_COMMIT}" \
                            ./backend
                    '''
                }
            }
        }
    }

    stage('Docker Push') {
        when {
            expression {
                params.ALWAYS_BUILD ||
                (
                    params.PUSH_DOCKER_IMAGE &&
                    (
                        env.FRONTEND_CHANGED == 'true' ||
                        env.BACKEND_CHANGED == 'true'
                    )
                )
            }
        }

        steps {
            withCredentials([
                usernamePassword(
                    credentialsId: "${DOCKER_CREDENTIALS_ID}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )
            ]) {
                sh '''
                    set -e

                    printf '%s' "$DOCKER_PASS" | docker login \
                        --username "$DOCKER_USER" \
                        --password-stdin

                    if [ "$ALWAYS_BUILD" = "true" ] || [ "$FRONTEND_CHANGED" = "true" ]; then
                        docker push "$FRONTEND_IMAGE_TAG"
                        docker push "${DOCKER_IMAGE_NAME_FRONTEND}:${GIT_COMMIT}"
                    fi

                    if [ "$ALWAYS_BUILD" = "true" ] || [ "$BACKEND_CHANGED" = "true" ]; then
                        docker push "$BACKEND_IMAGE_TAG"
                        docker push "${DOCKER_IMAGE_NAME_BACKEND}:${GIT_COMMIT}"
                    fi

                    docker logout
                '''
            }
        }
    }

    stage('Deploy') {
        when {
            expression {
                return params.ALWAYS_BUILD ||
                    (
                        params.DEPLOY &&
                        params.PUSH_DOCKER_IMAGE &&
                        params.DEPLOY_SERVER_IP?.trim() &&
                        (
                            env.FRONTEND_CHANGED == 'true' ||
                            env.BACKEND_CHANGED == 'true' ||
                            env.DEPLOY_CONFIG_CHANGED == 'true'
                        )
                    )
            }
        }

        steps {
            withCredentials([
                usernamePassword(
                    credentialsId: "${DOCKER_CREDENTIALS_ID}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                ),
                sshUserPrivateKey(
                    credentialsId: "${DEPLOY_SSH_CREDENTIALS_ID}",
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USER'
                )
            ]) {
                sh '''
                    set -e

                    DEPLOY_HOST="$DEPLOY_SERVER_IP"

                    ssh -i "$SSH_KEY" \
                        -o StrictHostKeyChecking=no \
                        "$SSH_USER@$DEPLOY_HOST" \
                        "sudo mkdir -p '$DEPLOY_DIR' && \
                         sudo chown '$SSH_USER':'$SSH_USER' '$DEPLOY_DIR'"

                    scp -i "$SSH_KEY" \
                        -o StrictHostKeyChecking=no \
                        docker-compose.yml \
                        "$SSH_USER@$DEPLOY_HOST:/tmp/docker-compose.yml"

                    ssh -i "$SSH_KEY" \
                        -o StrictHostKeyChecking=no \
                        "$SSH_USER@$DEPLOY_HOST" \
                        "sudo mv /tmp/docker-compose.yml '$DEPLOY_DIR/docker-compose.yml' && \
                         sudo chown '$SSH_USER':'$SSH_USER' '$DEPLOY_DIR/docker-compose.yml'"

                    ssh -i "$SSH_KEY" \
                        -o StrictHostKeyChecking=no \
                        "$SSH_USER@$DEPLOY_HOST" \
                        "touch '$DEPLOY_DIR/.env' && \
                         chmod 600 '$DEPLOY_DIR/.env'"

                    if [ "$ALWAYS_BUILD" = "true" ] || [ "$FRONTEND_CHANGED" = "true" ]; then
                        ssh -i "$SSH_KEY" \
                            -o StrictHostKeyChecking=no \
                            "$SSH_USER@$DEPLOY_HOST" \
                            "grep -v '^FRONTEND_IMAGE_TAG=' '$DEPLOY_DIR/.env' > '$DEPLOY_DIR/.env.tmp' || true; \
                             echo 'FRONTEND_IMAGE_TAG=$FRONTEND_IMAGE_TAG' >> '$DEPLOY_DIR/.env.tmp'; \
                             mv '$DEPLOY_DIR/.env.tmp' '$DEPLOY_DIR/.env'; \
                             chmod 600 '$DEPLOY_DIR/.env'"
                    fi

                    if [ "$ALWAYS_BUILD" = "true" ] || [ "$BACKEND_CHANGED" = "true" ]; then
                        ssh -i "$SSH_KEY" \
                            -o StrictHostKeyChecking=no \
                            "$SSH_USER@$DEPLOY_HOST" \
                            "grep -v '^BACKEND_IMAGE_TAG=' '$DEPLOY_DIR/.env' > '$DEPLOY_DIR/.env.tmp' || true; \
                             echo 'BACKEND_IMAGE_TAG=$BACKEND_IMAGE_TAG' >> '$DEPLOY_DIR/.env.tmp'; \
                             mv '$DEPLOY_DIR/.env.tmp' '$DEPLOY_DIR/.env'; \
                             chmod 600 '$DEPLOY_DIR/.env'"
                    fi

                    printf '%s' "$DOCKER_PASS" | ssh \
                        -i "$SSH_KEY" \
                        -o StrictHostKeyChecking=no \
                        "$SSH_USER@$DEPLOY_HOST" \
                        "docker login \
                            --username '$DOCKER_USER' \
                            --password-stdin"

                    ssh -i "$SSH_KEY" \
                        -o StrictHostKeyChecking=no \
                        "$SSH_USER@$DEPLOY_HOST" \
                        "cd '$DEPLOY_DIR' && \
                         docker compose pull && \
                         docker compose up -d && \
                         docker compose ps"

                    ssh -i "$SSH_KEY" \
                        -o StrictHostKeyChecking=no \
                        "$SSH_USER@$DEPLOY_HOST" \
                        "set -e; \
                         for i in \$(seq 1 30); do \
                             if curl --fail --silent --show-error --max-time 5 http://localhost/health >/dev/null; then \
                                 exit 0; \
                             fi; \
                             sleep 2; \
                         done; \
                         exit 1"

                    ssh -i "$SSH_KEY" \
                        -o StrictHostKeyChecking=no \
                        "$SSH_USER@$DEPLOY_HOST" \
                        "docker logout || true"

                    ssh -i "$SSH_KEY" \
                        -o StrictHostKeyChecking=no \
                        "$SSH_USER@$DEPLOY_HOST" \
                        "docker image prune -f"
                '''
            }
        }
    }
}

post {
    success {
        echo "Build #${env.BUILD_NUMBER} succeeded."
    }

    failure {
        echo "Build #${env.BUILD_NUMBER} failed."
    }

    always {
        cleanWs()
    }
}
```

}
