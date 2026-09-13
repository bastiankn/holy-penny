import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  appendFileSync,
} from 'node:fs';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

export function previewSlug(branch) {
  const readable = branch
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return `${readable}-${createHash('sha256').update(branch).digest('hex').slice(0, 8)}`;
}

export function targetFor(branch, repository) {
  if (branch !== 'main' && !/^(feature|codex)\/.+/.test(branch)) {
    throw new Error(`Unsupported deployment branch: ${branch}`);
  }
  const repo = repository.split('/')[1];
  if (!repo || !/^[a-zA-Z0-9_.-]+$/.test(repo)) throw new Error('Invalid repository name');
  const directory = branch === 'main' ? '' : `preview/${previewSlug(branch)}`;
  return { branch, directory, base: `/${repo}/${directory ? directory + '/' : ''}` };
}

export function branchForEvent(eventName, event, refName) {
  if (eventName === 'delete') {
    if (event.ref_type !== 'branch') throw new Error('Only branch deletions remove previews');
    return event.ref;
  }
  return refName;
}

/** Update exactly one part of the persistent site; validation precedes any removal. */
export function assembleSite({ site, dist, branch, repository, remove = false }) {
  const { directory } = targetFor(branch, repository);
  site = resolve(site);
  if (remove && !directory) throw new Error('Production cannot be removed');
  if (directory && !existsSync(join(site, 'index.html'))) {
    throw new Error(
      'Production is not initialized. Merge this workflow to main and deploy main first.'
    );
  }
  if (!remove) {
    dist = resolve(dist);
    const relationship = relative(site, dist);
    if (!relationship.startsWith('..' + '/') && !isAbsolute(relationship)) {
      throw new Error('Build directory must be outside the persistent site');
    }
    if (!existsSync(join(dist, 'index.html'))) throw new Error('Build is missing index.html');
    for (const reserved of ['.git', 'preview']) {
      if (existsSync(join(dist, reserved)))
        throw new Error(`Build contains reserved path: ${reserved}`);
    }
  }
  mkdirSync(site, { recursive: true });
  const destination = join(site, directory);
  if (directory) {
    rmSync(destination, { recursive: true, force: true });
  } else {
    for (const name of readdirSync(site)) {
      if (name !== '.git' && name !== 'preview')
        rmSync(join(site, name), { recursive: true, force: true });
    }
  }
  if (!remove) {
    mkdirSync(destination, { recursive: true });
    cpSync(dist, destination, { recursive: true });
  }
  writeFileSync(join(site, '.nojekyll'), '');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'target') {
    console.log(JSON.stringify(targetFor(args[0], args[1]), null, 2));
  } else if (command === 'metadata') {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const branch = branchForEvent(
      process.env.GITHUB_EVENT_NAME,
      event,
      process.env.GITHUB_REF_NAME
    );
    const target = targetFor(branch, process.env.GITHUB_REPOSITORY);
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `branch=${branch}\ndirectory=${target.directory}\nbase=${target.base}\n`
    );
  } else if (command === 'assemble') {
    assembleSite({
      site: args[0],
      dist: args[1],
      branch: process.env.DEPLOY_BRANCH,
      repository: process.env.GITHUB_REPOSITORY,
      remove: process.env.GITHUB_EVENT_NAME === 'delete',
    });
  } else {
    throw new Error('Usage: pages.mjs target BRANCH OWNER/REPO | metadata | assemble SITE DIST');
  }
}
