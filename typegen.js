const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o'];

const letterGroups = new Array(26).fill(null).map((_, index) => letters.slice(0, index + 1));

const componentTemplate = (
  lettersGroup,
  genericExtends,
  useDependencyGeneric,
  resolverGeneric,
  injectedGeneric,
) => {
  const generics = lettersGroup
    .map((l) => `${l.toUpperCase()} extends ${genericExtends}`)
    .join(',');
  const abcParams = lettersGroup.map((l) => `${l}: ${l.toUpperCase()}`).join(',');
  const projectParams = lettersGroup
    .map((l) => `p${l}: ${useDependencyGeneric}<${l.toUpperCase()}>`)
    .join(',');
  const injected = lettersGroup.map((l) => `${injectedGeneric}<${l.toUpperCase()}>`).join('&');
  const resolver = `${resolverGeneric}<$P, ${injected}>`;

  return `<${generics}, $P = DefaultProps>(${abcParams}, project: (${projectParams}) => FC<$P>,): ${resolver};`;
};

const hookTemplate = (
  lettersGroup,
  genericExtends,
  useDependencyGeneric,
  resolverGeneric,
  injectedGeneric,
) => {
  const generics = lettersGroup
    .map((l) => `${l.toUpperCase()} extends ${genericExtends}`)
    .join(',');
  const abcParams = lettersGroup.map((l) => `${l}: ${l.toUpperCase()}`).join(',');
  const projectParams = lettersGroup
    .map((l) => `p${l}: ${useDependencyGeneric}<${l.toUpperCase()}>`)
    .join(',');
  const injected = lettersGroup.map((l) => `${injectedGeneric}<${l.toUpperCase()}>`).join('&');
  const resolver = `${resolverGeneric}<$V, ${injected}>`;

  return `<$V extends object, ${generics}>(${abcParams}, project: (${projectParams}) => $V,): ${resolver};`;
};

const constantTemplate = (
  lettersGroup,
  genericExtends,
  useDependencyGeneric,
  resolverGeneric,
  injectedGeneric,
) => {
  const generics = lettersGroup
    .map((l) => `${l.toUpperCase()} extends ${genericExtends}`)
    .join(',');
  const abcParams = lettersGroup.map((l) => `${l}: ${l.toUpperCase()}`).join(',');
  const projectParams = lettersGroup
    .map((l) => `p${l}: ${useDependencyGeneric}<${l.toUpperCase()}>`)
    .join(',');
  const injected = lettersGroup.map((l) => `${injectedGeneric}<${l.toUpperCase()}>`).join('&');
  const resolver = `${resolverGeneric}<$V, ${injected}>`;

  return `<$V, ${generics}>(${abcParams}, project: (${projectParams}) => $V,): ${resolver};`;
};

const typings = {
  constants: letterGroups
    .map((group) =>
      constantTemplate(
        group,
        'PossibleConstantDependency',
        'UseConstantDependency',
        'InjectableConstantResolver',
        'InjectedConstantDependency',
      ),
    )
    .join(''),
  hooks: letterGroups
    .map((group) =>
      hookTemplate(
        group,
        'PossibleHookDependency',
        'UseHookDependency',
        'InjectableHookResolver',
        'InjectedHookDependency',
      ),
    )
    .join(''),
  components: letterGroups
    .map((group) =>
      componentTemplate(
        group,
        'PossibleComponentDependency',
        'UseComponentDependency',
        'InjectableComponentResolver',
        'InjectedComponentDependency',
      ),
    )
    .join(''),
};
