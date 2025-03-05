// 메타데이터 생성 함수

interface MetadataProps {
  params: {
    owner: string
    repo: string
  }
}

export async function generateMetadata({ params }: MetadataProps) {
  const { owner, repo } = params;
  
  return {
    title: `${owner}/${repo} - 저장소 분석 | Contribase`,
    description: `${owner}/${repo} 저장소에 대한 자세한 분석 결과를 확인해보세요.`
  }
} 